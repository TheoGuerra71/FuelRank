/**
 * Hook opcional para listar postos via API REST (legado p/ componentes que esperam `prices` humanizado).
 * A Home principal (`Index`) usa `apiRequest` direto — mantemos este arquivo tipado para `StationCard` e similares.
 */

import { apiRequest } from '@/lib/api';
import type { StationWithFuelPrices } from '@/types/app';
import { useQuery } from '@tanstack/react-query';

export interface StationWithPrices {
  id: string;
  name: string;
  brand: string;
  address: string;
  rating: number;
  review_count: number;
  has_promotion: boolean;
  promotion_text: string | null;
  seal: 'trusted' | 'observation' | 'complaints';
  complaints_count: number;
  lat: number;
  lng: number;
  prices: {
    fuel_type: string;
    price: number;
    updated_at: string;
  }[];
}

const fuelTypeLabels: Record<string, string> = {
  gasolina_comum: 'Gasolina Comum',
  gasolina_aditivada: 'Gasolina Aditivada',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
};

/** Converte o payload da API (`fuel_prices` + enums) para o formato antigo do card. */
function mapToStationWithPrices(s: StationWithFuelPrices): StationWithPrices {
  const rawPrices = s.fuel_prices ?? [];
  return {
    id: s.id,
    name: s.name,
    brand: s.brand,
    address: s.address,
    rating: s.rating,
    review_count: s.review_count,
    has_promotion: Boolean((s as { has_promotion?: boolean }).has_promotion),
    promotion_text: (s as { promotion_text?: string | null }).promotion_text ?? null,
    seal: s.seal as StationWithPrices['seal'],
    complaints_count: s.complaints_count,
    lat: s.lat,
    lng: s.lng,
    prices: rawPrices.map((p) => ({
      fuel_type: fuelTypeLabels[p.fuel_type] || p.fuel_type,
      price: Number(p.price),
      updated_at: typeof p.updated_at === 'string' ? p.updated_at : new Date().toISOString(),
    })),
  };
}

export const useStations = (fuelFilter: string, search: string, tenantId?: string | null) => {
  return useQuery({
    queryKey: ['stations', fuelFilter, search, tenantId],
    queryFn: async (): Promise<StationWithPrices[]> => {
      const rows = await apiRequest<StationWithFuelPrices[]>('stations', {
        query: tenantId ? { tenantId } : {},
      });
      let result = rows.map(mapToStationWithPrices);

      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.brand.toLowerCase().includes(q),
        );
      }

      if (fuelFilter !== 'Todos') {
        result = result.filter((s) =>
          s.prices.some((p) => p.fuel_type.toLowerCase().includes(fuelFilter.toLowerCase())),
        );
      }

      return result;
    },
  });
};
