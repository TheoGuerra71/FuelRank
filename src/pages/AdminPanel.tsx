import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle, Fuel, Users, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface StationRow {
  id: string;
  name: string;
  brand: string;
  address: string;
  rating: number;
  review_count: number;
  complaints_count: number;
  seal: string;
}

interface ComplaintRow {
  id: string;
  station_id: string;
  description: string;
  fuel_type: string;
  proof_url: string;
  status: string;
  created_at: string;
}

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationRow[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [tab, setTab] = useState<"stations" | "users" | "complaints">("stations");
  const [loadingData, setLoadingData] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow | null>(null);

  // O parâmetro 'isInitial' impede que a tela fique preta toda vez que aprovar algo
  const fetchAllData = async (isInitial = false) => {
    if (isInitial) setLoadingData(true);
    const [stationsRes, profilesRes, complaintsRes] = await Promise.all([
      supabase.from("stations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("points", { ascending: false }).limit(50),
      supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    
    if (stationsRes.data) setStations(stationsRes.data);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (complaintsRes.data) setComplaints(complaintsRes.data);
    if (isInitial) setLoadingData(false);
  };

  useEffect(() => {
    fetchAllData(true);
  }, []);

  // --- FUNÇÕES DE APROVAR E REJEITAR ---
  const handleApproveComplaint = async (complaintId: string, stationId: string) => {
    try {
      // 1. Muda status no banco
      await supabase.from("complaints").update({ status: "approved" }).eq("id", complaintId);
      
      // 2. Aumenta o contador de denúncias do Posto!
      const station = stations.find(s => s.id === stationId);
      if (station) {
        const newCount = (station.complaints_count || 0) + 1;
        await supabase.from("stations").update({ complaints_count: newCount }).eq("id", stationId);
      }

      // 3. Atualiza a tela imediatamente (Sem piscar)
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: "approved" } : c));
      alert("Denúncia aprovada! O posto foi penalizado.");
      setSelectedComplaint(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao aprovar a denúncia.");
    }
  };

  const handleRejectComplaint = async (complaintId: string) => {
    try {
      await supabase.from("complaints").update({ status: "rejected" }).eq("id", complaintId);
      
      // Atualiza a tela imediatamente
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: "rejected" } : c));
      alert("Denúncia rejeitada e descartada.");
      setSelectedComplaint(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao rejeitar a denúncia.");
    }
  };

  const tabs = [
    { key: "stations" as const, label: "Postos", icon: Fuel, count: stations.length },
    { key: "users" as const, label: "Usuários", icon: Users, count: profiles.length },
    { key: "complaints" as const, label: "Denúncias", icon: AlertTriangle, count: complaints.length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="bg-card border-b border-border px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">Painel Administrativo</h1>
        </div>

        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} />
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loadingData ? (
          <p className="text-center text-sm text-muted-foreground py-12">Buscando dados no servidor...</p>
        ) : (
          <>
            {tab === "stations" && stations.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-sm text-foreground">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.address}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.seal === "trusted" ? "bg-green-500/10 text-green-500" :
                    s.seal === "complaints" ? "bg-red-500/10 text-red-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {s.seal}
                  </span>
                </div>
                <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>⭐ {s.rating}</span>
                  <span>{s.review_count} avaliações</span>
                  <span>{s.complaints_count} denúncias</span>
                </div>
              </motion.div>
            ))}

            {tab === "users" && profiles.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                  {p.display_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.display_name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.influence_level} · {p.points} pts</div>
                </div>
                <div className="text-xs text-muted-foreground">{p.total_refuels} abast.</div>
              </motion.div>
            ))}

            {tab === "complaints" && complaints.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedComplaint(c)}
                className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                    c.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                    c.status === "approved" ? "bg-red-500/10 text-red-500" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>
                    {c.status === "pending" ? "Pendente" : c.status === "approved" ? "Aprovada" : "Rejeitada"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                  <span>Combustível: {c.fuel_type?.toUpperCase()}</span>
                  <span>{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedComplaint && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedComplaint(null)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            
            {/* O SEGREDO DO MODAL AQUI: flex-col, max-h-[90vh] e overflow-hidden */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Cabeçalho Travado (shrink-0) */}
              <div className="shrink-0 flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <AlertTriangle className="text-destructive" size={20}/> Detalhes da Fraude
                </h2>
                <button onClick={() => setSelectedComplaint(null)} className="p-1 rounded-full hover:bg-muted text-muted-foreground"><X size={20} /></button>
              </div>

              {/* Corpo com Rolagem (overflow-y-auto) */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Descrição relatada</span>
                    <p className="text-sm text-foreground mt-1 bg-secondary/50 p-3 rounded-lg">{selectedComplaint.description}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Comprovante em Anexo</span>
                    {selectedComplaint.proof_url && selectedComplaint.proof_url !== "https://exemplo.com/foto-anexada.jpg" ? (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <img src={selectedComplaint.proof_url} alt="Comprovante da fraude" className="w-full h-auto object-contain bg-black/5" />
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">Nenhuma foto real anexada.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé Travado (shrink-0) */}
              {selectedComplaint.status === "pending" && (
                <div className="shrink-0 p-4 border-t border-border flex gap-3 bg-secondary/20">
                  <button onClick={() => handleRejectComplaint(selectedComplaint.id)} className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm border border-border bg-card hover:bg-muted transition-colors text-muted-foreground">
                    <XCircle size={18} /> Rejeitar
                  </button>
                  <button onClick={() => handleApproveComplaint(selectedComplaint.id, selectedComplaint.station_id)} className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">
                    <CheckCircle size={18} /> Aprovar Punição
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;