import { useState } from "react";
import { Search, Plus, Bell, SlidersHorizontal, Fuel } from "lucide-react";
import { motion } from "framer-motion";
import { useStations } from "@/hooks/useStations";
import StationCard from "@/components/StationCard";
import FuelTypeFilter from "@/components/FuelTypeFilter";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("Todos");
  const { data: stations = [], isLoading } = useStations(fuelFilter, search);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Fuel size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">FuelRank</h1>
              <p className="text-[10px] text-muted-foreground">Preços reais, avaliações verificadas</p>
            </div>
          </div>
          <button className="relative p-2 rounded-lg bg-secondary">
            <Bell size={18} className="text-foreground" />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-3 py-2.5 border border-border">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar posto, endereço..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button className="p-2.5 rounded-lg bg-background border border-border">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3">
        <FuelTypeFilter selected={fuelFilter} onSelect={setFuelFilter} />
      </div>

      {/* Stations */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">Postos próximos</h2>
          <span className="text-xs text-muted-foreground">{stations.length} encontrados</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Carregando postos...</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Nenhum posto encontrado</div>
        ) : (
          stations.map((station, i) => (
            <StationCard key={station.id} station={station} index={i} />
          ))
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary shadow-elevated flex items-center justify-center"
      >
        <Plus size={24} className="text-primary-foreground" />
      </motion.button>

      <BottomNav />
    </div>
  );
};

export default Index;
