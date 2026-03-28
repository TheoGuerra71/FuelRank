/**
 * Serialização Prisma → JSON no formato snake_case esperado pelo React legado.
 * Centralizamos aqui para as rotas públicas e do motorista não duplicarem lógica.
 */

import type { FuelPrice, Station } from '@prisma/client';

export function fuelPriceToRow(fp: FuelPrice) {
  return {
    id: fp.id,
    station_id: fp.stationId,
    fuel_type: fp.fuelType,
    price: Number(fp.price),
    updated_at: fp.updatedAt.toISOString(),
  };
}

export function stationListItem(s: Station & { fuelPrices: FuelPrice[] }) {
  return {
    id: s.id,
    tenant_id: s.tenantId,
    name: s.name,
    brand: s.brand,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    seal: s.seal,
    approval_status: s.approvalStatus,
    rating: s.rating,
    review_count: s.reviewCount,
    complaints_count: s.complaintsCount,
    has_promotion: s.hasPromotion,
    promotion_text: s.promotionText,
    photos: s.photos,
    cnpj: s.cnpj,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
    fuel_prices: s.fuelPrices.map(fuelPriceToRow),
  };
}
