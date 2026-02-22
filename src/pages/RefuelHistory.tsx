import { ArrowLeft, Fuel, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const fuelTypeLabels: Record<string, string> = {
  gasolina_comum: "Gasolina Comum",
  gasolina_aditivada: "Gasolina Aditivada",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
};

const RefuelHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: refuels = [] } = useQuery({
    queryKey: ["refuels", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("refueling_history")
        .select("*, stations(name)")
        .eq("user_id", user!.id)
        .order("refueling_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalSpent = refuels.reduce((acc, r) => acc + Number(r.total), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-display font-semibold text-foreground">Histórico</h1>
          <div className="w-6" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <div className="text-[10px] text-muted-foreground">Total gasto</div>
            <div className="font-display font-bold text-lg text-primary">
              R$ {totalSpent.toFixed(2)}
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground">Abastecimentos</div>
            <div className="font-display font-bold text-lg text-foreground">{refuels.length}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {refuels.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhum abastecimento registrado</p>
        ) : (
          refuels.map((refuel, i) => (
            <motion.div
              key={refuel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {(refuel as any).stations?.name || "Posto"}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar size={10} />
                    {new Date(refuel.refueling_date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-foreground">R$ {Number(refuel.total).toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="bg-secondary px-2 py-0.5 rounded">
                  {fuelTypeLabels[refuel.fuel_type] || refuel.fuel_type}
                </span>
                <span>{Number(refuel.liters)}L</span>
                <span>R$ {Number(refuel.price_per_liter).toFixed(2)}/L</span>
                {refuel.km && <span className="ml-auto">{refuel.km.toLocaleString()} km</span>}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default RefuelHistory;
