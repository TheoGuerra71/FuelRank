import type { Database } from '@/integrations/supabase/types';

export type FuelType = Database['public']['Enums']['fuel_type'];
export type SealStatus = Database['public']['Enums']['seal_status'];
export type ComplaintStatus = Database['public']['Enums']['complaint_status'];
export type AppRole = Database['public']['Enums']['app_role'];

export type StationRow = Database['public']['Tables']['stations']['Row'] & { tenant_id?: string | null };
export type FuelPriceRow = Database['public']['Tables']['fuel_prices']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  company_name?: string | null;
  document_id?: string | null;
};
export type ComplaintRow = Database['public']['Tables']['complaints']['Row'] & { tenant_id?: string | null };
export type RefuelingHistoryRow = Database['public']['Tables']['refueling_history']['Row'] & { tenant_id?: string | null };

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembershipRow {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  created_at: string;
}

export type StationWithFuelPrices = StationRow & {
  fuel_prices: FuelPriceRow[];
  displayPriceObj?: FuelPriceRow;
};

export type AdminComplaint = ComplaintRow & {
  stations: Pick<StationRow, 'name'> | null;
  profiles: Pick<ProfileRow, 'display_name'> | null;
};

export type RefuelWithStation = RefuelingHistoryRow & {
  stations: Pick<StationRow, 'name'> | null;
};
