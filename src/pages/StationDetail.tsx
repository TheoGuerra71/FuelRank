import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Camera, Clock, MapPin, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const fuelTypeLabels: Record<string, string> = {
  gasolina_comum: "Gasolina Comum",
  gasolina_aditivada: "Gasolina Aditivada",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
};

const sealConfig = {
  trusted: { icon: ShieldCheck, label: "Posto Confiável", className: "text-success bg-success/10 border-success/20" },
  observation: { icon: AlertTriangle, label: "Em Observação", className: "text-warning bg-warning/10 border-warning/20" },
  complaints: { icon: ShieldAlert, label: "Alto Índice de Reclamação", className: "text-destructive bg-destructive/10 border-destructive/20" },
};

const StationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: station, isLoading } = useQuery({
    queryKey: ["station", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stations").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: prices = [] } = useQuery({
    queryKey: ["station-prices", id],
    queryFn: async () => {
      const { data } = await supabase.from("fuel_prices").select("*").eq("station_id", id!);
      return data || [];
    },
    enabled: !!id,
  });

  // NOVA BUSCA: Puxa todas as denúncias APROVADAS deste posto
  const { data: approvedComplaints = [] } = useQuery({
    queryKey: ["station-complaints", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("station_id", id!)
        .eq("status", "approved") // Mostra só o que o Admin aprovou!
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>;
  }

  if (!station) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Posto não encontrado</p></div>;
  }

  const seal = sealConfig[station.seal as keyof typeof sealConfig] || sealConfig.observation;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-5">
        <button onClick={() => navigate(-1)} className="mb-4 p-1">
          <ArrowLeft size={22} className="text-foreground" />
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground mb-1">{station.name}</h1>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
              <MapPin size={12} />
              <span>{station.address}</span>
            </div>
            <span className="text-xs font-medium text-primary">{station.brand}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Star size={16} className="text-warning fill-warning" />
              <span className="font-display font-bold text-lg text-foreground">{Number(station.rating).toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{station.review_count} avaliações</span>
          </div>
        </div>

        <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${seal.className}`}>
          <seal.icon size={14} />
          <span className="font-medium">{seal.label}</span>
          {station.complaints_count > 0 && (
            <span className="ml-auto text-muted-foreground">{station.complaints_count} denúncias</span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="font-display font-semibold text-foreground mb-3">Preços atuais</h2>
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum preço cadastrado</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {prices.map((fuel, i) => (
              <motion.div key={fuel.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-lg border border-border p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{fuelTypeLabels[fuel.fuel_type] || fuel.fuel_type}</div>
                <div className="font-display text-xl font-bold text-foreground">R$ {Number(fuel.price).toFixed(2)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{new Date(fuel.updated_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ÁREA NOVA: Lista Pública de Fraudes Confirmadas */}
      {approvedComplaints.length > 0 && (
        <div className="px-4 py-2 mb-4">
          <h2 className="font-display font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle size={18} />
            Fraudes Confirmadas
          </h2>
          <div className="space-y-3">
            {approvedComplaints.map(c => (
              <div key={c.id} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-foreground font-medium">{c.description}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">
                    {c.fuel_type?.toUpperCase()}
                  </span>
                  <span>{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-2">
        <button 
          onClick={() => navigate(`/station/${id}/evaluate`)}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          <Camera size={20} />
          Avaliar Experiência (Requer Nota)
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default StationDetail;