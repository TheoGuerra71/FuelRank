import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle, MapPin, Search, Shield, ShieldAlert, ShieldCheck, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("postos"); // postos, usuarios, denuncias
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Dados
  const [stations, setStations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]); // Denúncias

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Busca Postos
        const { data: stationsData } = await supabase.from("stations").select("*").order("created_at", { ascending: false });
        if (stationsData) setStations(stationsData);

        // Busca Usuários
        const { data: usersData } = await supabase.from("profiles").select("*").order("points", { ascending: false });
        if (usersData) setUsers(usersData);

        // Busca Denúncias Pendentes (Aqui assumimos que você tem uma tabela evaluations ou reports)
        // Como não temos a estrutura exata, se der erro, ele apenas mostra vazio graciosamente
        const { data: reportsData } = await supabase.from("evaluations").select("*, stations(name), profiles(display_name)").eq("status", "pending").catch(() => ({ data: [] }));
        if (reportsData) setReports(reportsData);

      } catch (error) {
        console.error("Erro ao buscar dados do painel:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Funções de Ação do Admin (Exemplos)
  const handleUpdateSeal = async (stationId: string, newSeal: string) => {
    try {
      await supabase.from("stations").update({ seal: newSeal }).eq("id", stationId);
      setStations(stations.map(s => s.id === stationId ? { ...s, seal: newSeal } : s));
    } catch (error) {
      alert("Erro ao atualizar selo.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 pb-24 font-sans">
      
      {/* CABEÇALHO DARK EXECUTIVO */}
      <div className="bg-slate-900 px-4 pt-12 pb-20 rounded-b-[40px] shadow-2xl relative z-0">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Shield size={24} className="text-primary" /> Central de Comando
            </h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Acesso Restrito</p>
          </div>
        </div>

        {/* Barra de Busca Rápida Admin */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar ID, posto ou usuário..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS (Flutuando sobre o header) */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center justify-center gap-1">
            <MapPin size={20} className="text-blue-500 mb-1" />
            <span className="font-display font-bold text-xl text-foreground">{stations.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Postos</span>
          </div>
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center justify-center gap-1">
            <Users size={20} className="text-green-500 mb-1" />
            <span className="font-display font-bold text-xl text-foreground">{users.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Usuários</span>
          </div>
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
            {reports.length > 0 && <div className="absolute top-0 w-full h-1 bg-destructive animate-pulse"></div>}
            <AlertTriangle size={20} className="text-destructive mb-1" />
            <span className="font-display font-bold text-xl text-foreground">{reports.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider text-center leading-tight">Denúncias Pendentes</span>
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="px-4 mt-6 mb-4">
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
          {[
            { id: "postos", label: "Postos", icon: <MapPin size={16}/> },
            { id: "usuarios", label: "Usuários", icon: <Users size={16}/> },
            { id: "denuncias", label: "Denúncias", icon: <ShieldAlert size={16}/> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'denuncias' && reports.length > 0 && (
                <span className="bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full">{reports.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* --- ABA POSTOS --- */}
            {activeTab === "postos" && (
              <motion.div key="postos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {stations.map((station) => (
                  <div key={station.id} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{station.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{station.address}</p>
                      </div>
                      
                      {/* Selo Atual */}
                      {station.seal === 'trusted' ? (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12}/> Confiável</span>
                      ) : station.seal === 'complaints' ? (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={12}/> Denunciado</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ShieldAlert size={12}/> Observação</span>
                      )}
                    </div>

                    <hr className="border-border/50" />
                    
                    {/* Botões de Ação Rápida */}
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateSeal(station.id, 'trusted')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${station.seal === 'trusted' ? 'bg-green-500 text-white border-green-500' : 'bg-transparent text-muted-foreground border-border hover:bg-green-50'}`}>
                        Tornar Confiável
                      </button>
                      <button onClick={() => handleUpdateSeal(station.id, 'complaints')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${station.seal === 'complaints' ? 'bg-destructive text-white border-destructive' : 'bg-transparent text-muted-foreground border-border hover:bg-red-50'}`}>
                        Marcar Fraude
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* --- ABA USUÁRIOS --- */}
            {activeTab === "usuarios" && (
              <motion.div key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="bg-background border border-border rounded-xl p-3 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold font-display">
                      {user.display_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-foreground">{user.display_name || "Usuário Anônimo"}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium">{user.influence_level || "Iniciante"}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-orange-100 text-orange-600 font-bold text-xs px-2 py-1 rounded-lg">{user.points || 0} pts</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* --- ABA DENÚNCIAS --- */}
            {activeTab === "denuncias" && (
              <motion.div key="denuncias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {reports.length > 0 ? reports.map((report) => (
                  <div key={report.id} className="bg-background border-2 border-destructive/20 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
                    
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <AlertTriangle size={16} className="text-destructive"/> Fraude Reportada
                      </h3>
                      <span className="text-[10px] text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-lg text-xs text-foreground mb-3 space-y-1 border border-border/50">
                      <p><span className="font-bold text-muted-foreground">Posto:</span> {report.stations?.name || "Desconhecido"}</p>
                      <p><span className="font-bold text-muted-foreground">Usuário:</span> {report.profiles?.display_name || "Anônimo"}</p>
                      <p><span className="font-bold text-muted-foreground">Relato:</span> "{report.comment || "Sem comentário"}"</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 active:scale-95 shadow-sm">
                        <CheckCircle size={14}/> Aprovar Punição
                      </button>
                      <button className="flex-1 bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 active:scale-95">
                        <XCircle size={14}/> Descartar
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 px-4 bg-background rounded-2xl border border-dashed border-border">
                    <CheckCircle size={32} className="text-green-500 mx-auto mb-3 opacity-50"/>
                    <h3 className="font-bold text-foreground text-sm">Tudo tranquilo por aqui!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Nenhuma denúncia pendente de análise.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;