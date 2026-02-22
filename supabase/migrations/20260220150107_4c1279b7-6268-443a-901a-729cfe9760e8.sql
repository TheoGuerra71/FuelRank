
-- Enum for fuel types
CREATE TYPE public.fuel_type AS ENUM ('gasolina_comum', 'gasolina_aditivada', 'etanol', 'diesel', 'gnv');

-- Enum for station seal status
CREATE TYPE public.seal_status AS ENUM ('trusted', 'observation', 'complaints');

-- Enum for complaint status
CREATE TYPE public.complaint_status AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  cpf TEXT,
  phone TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  influence_level TEXT NOT NULL DEFAULT 'Iniciante',
  total_refuels INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  price_updates INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Stations table
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Bandeira Branca',
  address TEXT NOT NULL,
  cnpj TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  seal seal_status NOT NULL DEFAULT 'observation',
  complaints_count INTEGER NOT NULL DEFAULT 0,
  has_promotion BOOLEAN NOT NULL DEFAULT false,
  promotion_text TEXT,
  photos TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- Fuel prices table
CREATE TABLE public.fuel_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  fuel_type fuel_type NOT NULL,
  price NUMERIC(5,2) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_id, fuel_type)
);
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

-- Reviews table (requires proof)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  proof_url TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Refueling history
CREATE TABLE public.refueling_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  fuel_type fuel_type NOT NULL,
  liters NUMERIC(6,2) NOT NULL,
  price_per_liter NUMERIC(5,2) NOT NULL,
  total NUMERIC(8,2) NOT NULL,
  km INTEGER,
  refueling_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.refueling_history ENABLE ROW LEVEL SECURITY;

-- Complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fuel_type fuel_type NOT NULL,
  refueling_date DATE NOT NULL,
  description TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  video_url TEXT,
  status complaint_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Fuel price history (for charts)
CREATE TABLE public.fuel_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  fuel_type fuel_type NOT NULL,
  price NUMERIC(5,2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fuel_price_history ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fuel_prices_updated_at BEFORE UPDATE ON public.fuel_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- stations: publicly readable
CREATE POLICY "Stations are publicly readable" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create stations" ON public.stations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update stations" ON public.stations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- fuel_prices: publicly readable
CREATE POLICY "Fuel prices are publicly readable" ON public.fuel_prices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert prices" ON public.fuel_prices FOR INSERT TO authenticated WITH CHECK (auth.uid() = updated_by);
CREATE POLICY "Authenticated users can update prices" ON public.fuel_prices FOR UPDATE TO authenticated USING (auth.uid() = updated_by OR public.has_role(auth.uid(), 'admin'));

-- reviews
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- refueling_history: private to user
CREATE POLICY "Users can view own refueling history" ON public.refueling_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own refueling history" ON public.refueling_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own refueling history" ON public.refueling_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own refueling history" ON public.refueling_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- complaints
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT TO authenticated USING (auth.uid() = reported_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- fuel_price_history: publicly readable
CREATE POLICY "Price history is publicly readable" ON public.fuel_price_history FOR SELECT USING (true);
CREATE POLICY "System can insert price history" ON public.fuel_price_history FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to log price changes to history
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fuel_price_history (station_id, fuel_type, price)
  VALUES (NEW.station_id, NEW.fuel_type, NEW.price);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_fuel_price_change
  AFTER INSERT OR UPDATE ON public.fuel_prices
  FOR EACH ROW EXECUTE FUNCTION public.log_price_change();
