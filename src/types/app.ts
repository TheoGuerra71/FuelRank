import type { Database } from '@/integrations/supabase/types';

export type FuelType = Database['public']['Enums']['fuel_type'];
export type SealStatus = Database['public']['Enums']['seal_status'];

/**
 * Status de denúncia alinhado ao backend Node (Prisma + Express).
 * Por que mudamos em relação ao enum legado do Supabase?
 * - O contrato HTTP da missão usa `in_analysis` e `archived` em vez de `under_review` e `dismissed`,
 *   para o vocabulário bater com o que o time de produto definiu na API própria.
 */
export type ComplaintStatus = 'pending' | 'in_analysis' | 'resolved' | 'archived' | 'approved';

export type AppRole = Database['public']['Enums']['app_role'];

export type StationRow = Database['public']['Tables']['stations']['Row'] & { tenant_id?: string | null };
export type FuelPriceRow = Database['public']['Tables']['fuel_prices']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  company_name?: string | null;
  document_id?: string | null;
  /** Preenchido pela API Node (Prisma); pode não existir nos tipos gerados do Supabase. */
  total_refuels?: number;
};
/** Linha de denúncia no app; o campo `status` segue o contrato Prisma/Express (não o catálogo antigo do Supabase). */
export type ComplaintRow = Omit<Database['public']['Tables']['complaints']['Row'], 'status'> & {
  status: ComplaintStatus;
  tenant_id?: string | null;
};
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

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];

/** Avaliação com joins para o painel (comentário, posto, autor). */
export type AdminModerationReview = ReviewRow & {
  stations?: Pick<StationRow, 'id' | 'name'> | null;
  profiles?: Pick<ProfileRow, 'display_name'> | null;
};

export type StationApprovalStatus = 'pending' | 'approved' | 'rejected';

/** Campos opcionais que a API pode enviar no admin/overview. */
export type AdminStationRow = StationRow & {
  approval_status?: StationApprovalStatus;
  fuel_prices?: Pick<FuelPriceRow, 'id' | 'fuel_type' | 'price'>[];
};

export type RefuelWithStation = RefuelingHistoryRow & {
  stations: Pick<StationRow, 'name'> | null;
};
