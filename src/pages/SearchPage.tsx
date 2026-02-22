import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStations } from "@/hooks/useStations";
import StationCard from "@/components/StationCard";
import BottomNav from "@/components/BottomNav";

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const { data: stations = [], isLoading } = useStations("Todos", query);

  const sorted = [...stations].sort((a, b) => {
    if (sortBy === "price") {
      const priceA = a.prices.find((p) => p.fuel_type === "Gasolina Comum")?.price ?? 99;
      const priceB = b.prices.find((p) => p.fuel_type === "Gasolina Comum")?.price ?? 99;
      return priceA - priceB;
    }
    return Number(b.rating) - Number(a.rating);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-3 py-2.5 border border-border">
            <Search size={16} className="text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, bandeira, endereço..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {(["price", "rating"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                sortBy === sort
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {sort === "price" ? "💰 Menor preço" : "⭐ Avaliação"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-12">Carregando...</p>
        ) : sorted.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum posto encontrado</p>
        ) : (
          sorted.map((station, i) => (
            <StationCard key={station.id} station={station} index={i} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;
