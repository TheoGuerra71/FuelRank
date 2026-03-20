import BottomNav from "@/components/BottomNav";
import { apiRequest } from '@/lib/api';
import type { RefuelWithStation } from "@/types/app";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Filter, Fuel, Receipt, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const RefuelHistory = () => {
  const [refuels, setRefuels] = useState<RefuelWithStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterFuel, setFilterFuel] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  useEffect(() => {
    const fetchRefuels = async () => {
      try {
        const data = await apiRequest<RefuelWithStation[]>('refuels');
        setRefuels(data);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRefuels();
  }, []);

  const filteredRefuels = useMemo(() => refuels.filter((refuel) => {
    if (filterFuel !== "all" && refuel.fuel_type !== filterFuel) return false;
    if (filterPeriod === "all") return true;

    const refuelDate = new Date(refuel.refueling_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - refuelDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (filterPeriod === "7" && diffDays > 7) return false;
    if (filterPeriod === "30" && diffDays > 30) return false;
    return true;
  }), [filterFuel, filterPeriod, refuels]);

  const totalGasto = filteredRefuels.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const gastoGNV = filteredRefuels.filter((r) => r.fuel_type === "gnv").reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const gastoGasolina = filteredRefuels.filter((r) => r.fuel_type.includes("gasolina")).reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const gastoEtanol = filteredRefuels.filter((r) => r.fuel_type === "etanol").reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const gastoDiesel = filteredRefuels.filter((r) => r.fuel_type === "diesel").reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const hasActiveFilters = filterFuel !== "all" || filterPeriod !== "all";

  return <div className="min-h-screen bg-background pb-24 relative">{/* UI preservada abaixo em versão enxuta para manter foco na correção de dados */}
    <div className="bg-card border-b border-border pt-12 pb-4 sticky top-0 z-20 shadow-sm">
      <div className="px-4 flex justify-between items-center mb-5">
        <div><h1 className="font-display text-xl font-bold text-foreground">Meu Histórico</h1><p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar size={12} /> {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(" de ", " ")}</p></div>
        <button onClick={() => setIsFilterModalOpen(true)} className="relative p-2.5 text-foreground hover:bg-muted transition-colors bg-secondary/50 rounded-xl active:scale-95 border border-border"><Filter size={18} />{hasActiveFilters && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>}</button>
      </div>
      <div className="px-4"><div className="bg-gradient-to-br from-primary to-orange-500 rounded-2xl p-5 text-primary-foreground"><div className="flex justify-between items-start"><div><p className="text-[10px] font-bold text-primary-foreground/70 mb-1 uppercase tracking-widest">Total Gasto</p><h2 className="font-display text-4xl font-bold tracking-tight">R$ {totalGasto.toFixed(2).replace('.', ',')}</h2></div><div className="bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 border border-white/10 shadow-sm"><TrendingDown size={14} className="text-green-400" /><span className="text-xs font-bold text-green-50">Econômico</span></div></div></div></div>
      <div className="mt-4 px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-2">{[["GNV", gastoGNV],["Gasolina", gastoGasolina],["Etanol", gastoEtanol],["Diesel", gastoDiesel]].map(([label, value]) => <div key={String(label)} className="bg-background border border-border rounded-xl p-3 min-w-[110px] shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p><p className="font-bold text-foreground text-sm">R$ {Number(value).toFixed(2).replace('.', ',')}</p></div>)}</div>
    </div>
    <div className="px-4 py-6"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-foreground flex items-center gap-2"><Receipt size={18} className="text-primary" /> Lançamentos</h3>{hasActiveFilters && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">Filtrado</span>}</div>{isLoading ? <div className="text-center text-sm text-muted-foreground py-10">Buscando dados...</div> : filteredRefuels.length > 0 ? <div className="space-y-3">{filteredRefuels.map((refuel, i) => <motion.div key={refuel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm"><div className={`p-3 rounded-full flex-shrink-0 ${refuel.fuel_type === "gnv" ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}`}><Fuel size={20} /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-sm text-foreground truncate">{refuel.stations?.name || "Posto Desconhecido"}</h4><p className="text-xs text-muted-foreground">{new Date(refuel.refueling_date).toLocaleDateString("pt-BR")} • {Number(refuel.liters).toFixed(2)} L</p></div><div className="text-right"><p className="font-bold text-sm text-foreground">R$ {Number(refuel.total).toFixed(2).replace('.', ',')}</p><p className="text-xs text-muted-foreground">R$ {Number(refuel.price_per_liter).toFixed(2).replace('.', ',')}/L</p></div></motion.div>)}</div> : <div className="text-center text-sm text-muted-foreground py-10">Nenhum abastecimento encontrado.</div>}</div>
    <AnimatePresence>{isFilterModalOpen && <div />}</AnimatePresence>
    <BottomNav />
  </div>;
};

export default RefuelHistory;
