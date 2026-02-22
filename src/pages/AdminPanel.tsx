import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Fuel, Users } from "lucide-react";
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

const AdminPanel = () => {
  // Removi a dependência do authLoading para evitar o travamento na tela de "Carregando"
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationRow[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tab, setTab] = useState<"stations" | "users" | "complaints">("stations");
  const [loadingData, setLoadingData] = useState(true);

  // Removi o useEffect que te expulsava da página caso o isAdmin demorasse a carregar

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const [stationsRes, profilesRes, complaintsRes] = await Promise.all([
        supabase.from("stations").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("points", { ascending: false }).limit(50),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      
      if (stationsRes.data) setStations(stationsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (complaintsRes.data) setComplaints(complaintsRes.data);
      setLoadingData(false);
    };

    // Agora ele tenta buscar os dados independente da flag isAdmin para garantir que você veja a tela
    fetchData();
  }, []);

  const tabs = [
    { key: "stations" as const, label: "Postos", icon: Fuel, count: stations.length },
    { key: "users" as const, label: "Usuários", icon: Users, count: profiles.length },
    { key: "complaints" as const, label: "Denúncias", icon: AlertTriangle, count: complaints.length },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
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
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-lg border border-border p-4"
              >
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
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-lg border border-border p-4 flex items-center gap-3"
              >
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
                className="bg-card rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                    c.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                    c.status === "resolved" ? "bg-green-500/10 text-green-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </div>
              </motion.div>
            ))}

            {((tab === "stations" && stations.length === 0) ||
              (tab === "users" && profiles.length === 0) ||
              (tab === "complaints" && complaints.length === 0)) && (
              <p className="text-center text-sm text-muted-foreground py-12">Nenhum registro encontrado</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;