-- ==========================================================
-- MULTI-TENANT + CADASTRO COMPLETO + SEGURANÇA POR TENANT
-- ==========================================================

CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'manager', 'member');

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS document_id TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS default_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fuel_prices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.refueling_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.fuel_price_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = _tenant_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_tenant_id UUID, _user_id UUID, _role public.tenant_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = _tenant_id
      AND user_id = _user_id
      AND role IN (_role, 'owner')
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  raw_tenant_slug TEXT;
BEGIN
  raw_tenant_slug := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'tenant_slug', ''), regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));

  INSERT INTO public.tenants (name, slug, owner_user_id)
  VALUES (
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'company_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)),
    lower(raw_tenant_slug),
    NEW.id
  )
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (user_id, display_name, phone, cpf, document_id, company_name, default_tenant_id, email_verified_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'cpf', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'document_id', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_name', ''),
    new_tenant_id,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN now() ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role) VALUES (new_tenant_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_email_verification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET email_verified_at = NEW.email_confirmed_at
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_email_verification_timestamp();

CREATE POLICY "Tenant members can read their tenants" ON public.tenants
FOR SELECT USING (public.is_tenant_member(id, auth.uid()));

CREATE POLICY "Owners can update their tenants" ON public.tenants
FOR UPDATE TO authenticated USING (public.has_tenant_role(id, auth.uid(), 'admin'));

CREATE POLICY "Users can read their memberships" ON public.tenant_memberships
FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Tenant members can read tenant profiles" ON public.profiles
FOR SELECT TO authenticated USING (default_tenant_id IS NOT NULL AND public.is_tenant_member(default_tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Stations are publicly readable" ON public.stations;
CREATE POLICY "Tenant members can read tenant stations" ON public.stations
FOR SELECT TO authenticated USING (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create stations" ON public.stations;
CREATE POLICY "Tenant members can create stations" ON public.stations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can update stations" ON public.stations;
CREATE POLICY "Tenant admins can update stations" ON public.stations
FOR UPDATE TO authenticated USING (tenant_id IS NOT NULL AND public.has_tenant_role(tenant_id, auth.uid(), 'admin'));
