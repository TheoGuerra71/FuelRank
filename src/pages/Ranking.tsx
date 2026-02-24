import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Crown, Flame, Medal, ShieldAlert, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

const Ranking = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pontos"); // 'pontos' ou 'fraudes'

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        // Busca os usuários ordenados pelos pontos
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("points", { ascending: false })
          .limit(50);

        if (data) {
          // Se o banco estiver vazio, colocamos dados falsos só para você ver como a tela é linda!
          // Assim que tiver usuários reais com pontos, ele mostra os reais.
          if (data.length < 3) {
            setUsers([
              { id: '1', display_name: 'Theo Guerra', points: 1250, influence_level: 'Embaixador', total_refuels: 42 },
              { id: '2', display_name: 'Carlos M.', points: 890, influence_level: 'Especialista', total_refuels: 28 },
              { id: '3', display_name: 'Ana Silva', points: 650, influence_level: 'Influente', total_refuels: 15 },
              { id: '4', display_name: 'João Pedro', points: 420, influence_level: 'Colaborador', total_refuels: 9 },
              { id: '5', display_name: 'Mariana Costa', points: 150, influence_level: 'Iniciante', total_refuels: 3 },
            ]);
          } else {
            setUsers(data);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [activeTab]);

  // Prepara o Pódio (Top 3) e a Lista (Resto)
  const top3 = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Cabeçalho */}
      <div className="bg-primary px-4 pt-12 pb-6 rounded-b-[40px] shadow-md relative z-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground flex items-center gap-2">
              <Trophy size={24} className="text-yellow-400" /> Top Motoristas
            </h1>
            <p className="text-primary-foreground/80 text-sm font-medium mt-1">Os maiores colaboradores do FuelRank</p>
          </div>
        </div>

        {/* Abas de Categoria */}
        <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('pontos')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'pontos' ? 'bg-background text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
          >
            <Flame size={16} className={activeTab === 'pontos' ? 'text-orange-500' : ''} /> Maiores Pontuações
          </button>
          <button 
            onClick={() => setActiveTab('fraudes')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'fraudes' ? 'bg-background text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
          >
            <ShieldAlert size={16} className={activeTab === 'fraudes' ? 'text-destructive' : ''} /> Caçadores de Fraude
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* O PÓDIO (Top 3) */}
          <div className="px-4 pt-8 pb-6 flex justify-center items-end gap-2 sm:gap-4 relative -mt-4">
            
            {/* 2º Lugar (Prata) */}
            {top3[1] && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-24">
                <div className="relative mb-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-400 rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10 relative">
                    <span className="font-display font-bold text-slate-700 text-lg">{top3[1].display_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-slate-300 rounded-full p-1 border-2 border-background shadow-sm">
                    <Medal size={14} className="text-slate-600" />
                  </div>
                </div>
                <div className="bg-slate-100 border border-slate-200 w-full pt-4 pb-2 px-1 rounded-t-xl text-center shadow-inner flex flex-col items-center">
                  <p className="text-[10px] font-bold text-foreground truncate w-full">{top3[1].display_name}</p>
                  <p className="text-xs font-bold text-slate-600">{top3[1].points} pts</p>
                </div>
              </motion.div>
            )}

            {/* 1º Lugar (Ouro) */}
            {top3[0] && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col items-center w-28 z-10">
                <div className="relative mb-2">
                  <Crown size={24} className="text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-md" />
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-full border-4 border-background flex items-center justify-center shadow-xl z-10 relative">
                    <span className="font-display font-bold text-yellow-900 text-3xl">{top3[0].display_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1.5 border-2 border-background shadow-sm">
                    <Trophy size={16} className="text-yellow-900" />
                  </div>
                </div>
                <div className="bg-gradient-to-t from-yellow-100 to-yellow-50 border border-yellow-200 w-full pt-5 pb-3 px-1 rounded-t-xl text-center shadow-[0_-5px_15px_rgba(234,179,8,0.2)] flex flex-col items-center h-24 justify-start">
                  <p className="text-xs font-bold text-foreground truncate w-full mb-0.5">{top3[0].display_name}</p>
                  <p className="text-[10px] text-yellow-700 font-bold uppercase mb-1">{top3[0].influence_level}</p>
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-black shadow-sm">
                    {top3[0].points} pts
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3º Lugar (Bronze) */}
            {top3[2] && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center w-24">
                <div className="relative mb-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full border-4 border-background flex items-center justify-center shadow-lg z-10 relative">
                    <span className="font-display font-bold text-amber-100 text-lg">{top3[2].display_name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-700 rounded-full p-1 border-2 border-background shadow-sm">
                    <Medal size={14} className="text-amber-200" />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 w-full pt-4 pb-2 px-1 rounded-t-xl text-center shadow-inner flex flex-col items-center h-16 justify-start">
                  <p className="text-[10px] font-bold text-foreground truncate w-full">{top3[2].display_name}</p>
                  <p className="text-xs font-bold text-amber-800">{top3[2].points} pts</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* LISTA DOS DEMAIS COLOCADOS (4º em diante) */}
          <div className="px-4 space-y-3">
            {restOfUsers.map((user, index) => (
              <motion.div 
                key={user.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-4 shadow-sm"
              >
                <div className="w-8 text-center font-display font-bold text-muted-foreground text-lg">
                  {index + 4}º
                </div>
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-foreground">
                  {user.display_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{user.display_name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{user.influence_level}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg">
                    <Flame size={14} />
                    <span className="font-bold text-sm">{user.points}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Ranking;