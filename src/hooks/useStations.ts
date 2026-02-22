import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StationWithPrices {
  id: string;
  name: string;
  brand: string;
  address: string;
  rating: number;
  review_count: number;
  has_promotion: boolean;
  promotion_text: string | null;
  seal: "trusted" | "observation" | "complaints";
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
  gasolina_comum: "Gasolina Comum",
  gasolina_aditivada: "Gasolina Aditivada",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
};

export const useStations = (fuelFilter: string, search: string) => {
  return useQuery({
    queryKey: ["stations", fuelFilter, search],
    queryFn: async (): Promise<StationWithPrices[]> => {
      const { data: stations, error } = await supabase
        .from("stations")
        .select("*")
        .order("rating", { ascending: false });

      if (error) throw error;

      const { data: prices } = await supabase
        .from("fuel_prices")
        .select("station_id, fuel_type, price, updated_at");

      const priceMap = new Map<string, StationWithPrices["prices"]>();
      (prices || []).forEach((p) => {
        const arr = priceMap.get(p.station_id) || [];
        arr.push({
          fuel_type: fuelTypeLabels[p.fuel_type] || p.fuel_type,
          price: Number(p.price),
          updated_at: p.updated_at,
        });
        priceMap.set(p.station_id, arr);
      });

      let result = (stations || []).map((s) => ({
        ...s,
        seal: s.seal as "trusted" | "observation" | "complaints",
        prices: priceMap.get(s.id) || [],
      }));

      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.brand.toLowerCase().includes(q)
        );
      }

      if (fuelFilter !== "Todos") {
        result = result.filter((s) =>
          s.prices.some((p) => p.fuel_type.toLowerCase().includes(fuelFilter.toLowerCase()))
        );
      }

      return result;
    },
  });
};
