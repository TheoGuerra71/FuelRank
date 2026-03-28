/**
 * Chamadas HTTP do painel administrativo — alinhadas ao Express em `backend/src/routes/adminRoutes.ts`.
 *
 * Por que Axios dedicado através do `apiClient` compartilhado?
 * - O mesmo interceptor envia `Authorization: Bearer <token>` após o login.
 * - Não há referência a Supabase BaaS aqui: a fonte da verdade passou a ser Node + Prisma + PostgreSQL.
 *
 * Observação: rotas são relativas à `VITE_API_URL` (ex.: admin/overview → GET .../api/admin/overview
 * se a base já for .../api — caso contrário ajuste a base para incluir /api como no backend).
 */

import { apiClient, getApiErrorMessage } from '@/lib/axiosClient';
import type {
  AdminComplaint,
  AdminModerationReview,
  AdminStationRow,
  ComplaintStatus,
  FuelType,
  ProfileRow,
  SealStatus,
} from '@/types/app';

/** Item de preço de referência conforme contrato PUT /api/admin/reference-fuel-prices */
export type ReferencePriceItem = { fuel_type: FuelType; price: number };

/**
 * Resposta do GET /api/admin/overview.
 * Incluímos aliases (`pending_reviews`, etc.) para tolerar evolução da API sem quebrar o normalizador.
 */
export type AdminOverviewResponse = {
  stations?: AdminStationRow[];
  users?: ProfileRow[];
  /** Denúncias com joins opcionais de posto e perfil (o AdminPanel espera `reports` no normalizador). */
  reports?: AdminComplaint[];
  complaints?: AdminComplaint[];
  /** Contrato explícito pedido na missão (avaliações pendentes de moderação). */
  pendingReviews?: AdminModerationReview[];
  reviews?: AdminModerationReview[];
  reviews_pending?: AdminModerationReview[];
  referencePrices?: Partial<Record<FuelType, number>>;
  reference_prices?: Partial<Record<FuelType, number>>;
  pendingStations?: AdminStationRow[];
  pending_stations?: AdminStationRow[];
};

export type NormalizedAdminOverview = {
  stations: AdminStationRow[];
  users: ProfileRow[];
  reports: AdminComplaint[];
  reviews: AdminModerationReview[];
  referencePrices: Partial<Record<FuelType, number>>;
  pendingStations: AdminStationRow[];
};

/**
 * Unificamos chaves camelCase / snake_case porque gateways e versões antigas da API podem misturar estilos.
 * Prioridade: pendingReviews (contrato novo) → reviews → reviews_pending.
 */
export function normalizeAdminOverview(raw: AdminOverviewResponse): NormalizedAdminOverview {
  const referencePrices = raw.referencePrices ?? raw.reference_prices ?? {};
  const reports = raw.reports ?? raw.complaints ?? [];
  const reviews = raw.pendingReviews ?? raw.reviews ?? raw.reviews_pending ?? [];

  return {
    stations: raw.stations ?? [],
    users: raw.users ?? [],
    reports,
    reviews,
    referencePrices,
    pendingStations: raw.pendingStations ?? raw.pending_stations ?? [],
  };
}

async function adminRequest<T>(config: { url: string; method?: string; data?: unknown; params?: Record<string, unknown> }): Promise<T> {
  try {
    const res = await apiClient.request<T>({
      url: config.url.replace(/^\//, ''),
      method: (config.method ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      data: config.data,
      params: config.params,
    });
    if (res.status === 204) return undefined as T;
    return res.data as T;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAdminOverview(tenantId: string | undefined): Promise<NormalizedAdminOverview> {
  const raw = await adminRequest<AdminOverviewResponse>({
    url: 'admin/overview',
    method: 'GET',
    params: tenantId ? { tenantId } : undefined,
  });
  return normalizeAdminOverview(raw);
}

export function patchStationSeal(stationId: string, seal: SealStatus) {
  return adminRequest<void>({ url: `admin/stations/${stationId}/seal`, method: 'PATCH', data: { seal } });
}

export function patchStationApproval(stationId: string, status: 'approved' | 'rejected') {
  return adminRequest<void>({ url: `admin/stations/${stationId}/approval`, method: 'PATCH', data: { status } });
}

export function patchStationFuelPricesAdmin(stationId: string, items: ReferencePriceItem[]) {
  return adminRequest<void>({ url: `admin/stations/${stationId}/prices`, method: 'PATCH', data: { items } });
}

/**
 * Corpo exatamente como o backend Express valida:
 * `{ tenantId, prices: [{ fuel_type, price }, ...] }`
 */
export function putReferenceFuelPrices(tenantId: string, prices: ReferencePriceItem[]) {
  return adminRequest<void>({
    url: 'admin/reference-fuel-prices',
    method: 'PUT',
    data: { tenantId, prices },
  });
}

export function patchReviewModeration(reviewId: string, isVerified: boolean) {
  return adminRequest<void>({
    url: `admin/reviews/${reviewId}`,
    method: 'PATCH',
    data: { is_verified: isVerified },
  });
}

export function patchComplaintStatus(complaintId: string, status: ComplaintStatus) {
  return adminRequest<void>({
    url: `admin/complaints/${complaintId}`,
    method: 'PATCH',
    data: { status },
  });
}
