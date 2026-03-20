import { selectedTenantCookieKey } from '@/lib/cookieStorage';
import { apiRequest } from '@/lib/api';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
}

interface TenantContextType {
  tenants: TenantSummary[];
  activeTenant: TenantSummary | null;
  loading: boolean;
  setActiveTenantId: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType>({ tenants: [], activeTenant: null, loading: true, setActiveTenantId: () => undefined });
export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTenantId = document.cookie.split('; ').find((entry) => entry.startsWith(`${selectedTenantCookieKey}=`))?.split('=')[1];
    setActiveTenantId(storedTenantId ? decodeURIComponent(storedTenantId) : null);
  }, []);

  useEffect(() => {
    const loadTenants = async () => {
      if (!user) {
        setTenants([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const payload = await apiRequest<{ tenants: TenantSummary[] }>('tenants');
        setTenants(payload.tenants);
        const nextTenantId = activeTenantId && payload.tenants.some((tenant) => tenant.id === activeTenantId) ? activeTenantId : payload.tenants[0]?.id ?? null;
        if (nextTenantId) setActiveTenantId(nextTenantId);
      } catch (error) {
        console.error('Erro ao carregar tenants:', error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    void loadTenants();
  }, [activeTenantId, user]);

  const setActiveTenantIdSafely = (tenantId: string) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${selectedTenantCookieKey}=${encodeURIComponent(tenantId)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict${secure}`;
    setActiveTenantId(tenantId);
  };

  const activeTenant = useMemo(() => tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0] ?? null, [activeTenantId, tenants]);
  return <TenantContext.Provider value={{ tenants, activeTenant, loading, setActiveTenantId: setActiveTenantIdSafely }}>{children}</TenantContext.Provider>;
};
