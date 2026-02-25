import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Crown, Flame, Medal, ShieldAlert, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

// 🏆 TELA DE RANKING: O Coliseu do FuelRank.
// É aqui que a mágica da gamificação acontece. Motoristas competem por pontos
// ajudando a comunidade (cadastrando postos, atualizando preços, denunciando fraudes).
const Ranking = () => {
  // ==========================================
  // ESTADOS DA TELA (Memória)
  // ==========================================
  
  // Lista de motoristas que vão aparecer no ranking
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🎛️ Controle de Abas: O usuário quer ver quem tem mais pontos ou quem denuncia mais?
  // (Nota para o Theo do futuro: A lógica do banco para a aba 'fraudes' pode ser conectada depois,
  // mas a interface já está 100% pronta para reagir a essa mudança de estado).
  const [activeTab, setActiveTab] = useState("pontos"); 

  // ==========================================
  // BUSCA DE DADOS (A Classificação)
  // ==========================================
  // Esse useEffect roda toda vez que a tela abre, OU toda vez que a aba (activeTab) mudar.
  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true);
      try {
        // ⚡ A Consulta Suprema:
        // Vai na tabela de perfis, ordena todo mundo pelos pontos (do maior pro menor)
        // e pega SÓ os 50 primeiros. Afinal, ninguém vai rolar a tela pra ver o 15.000º colocado, 
        // e isso economiza muita banda de internet!
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("points", { ascending: false })
          .limit(50);

        if (data) {
          // 🎭 TRUQUE DE ENGENHARIA DE UI (Mock Data Injetion)
          // Se o banco estiver vazio (app acabou de lançar), a tela ia ficar em branco. 
          // Para o seu portfólio e apresentação ficarem impecáveis, nós injetamos 
          // dados "falsos" se houver menos de 3 pessoas reais cadastradas.
          // Assim que 3 motoristas reais ganharem pontos, esses falsos somem automaticamente!
          if (data.length < 3) {
            setUsers([
              { id: '1', display_name: 'Theo Guerra', points: 1250, influence_level: 'Embaixador', total_refuels: 42 },
              { id: '2', display_name: 'Carlos M.', points: 890, influence_level: 'Especialista', total_refuels: 28 },
              { id: '3', display_name: 'Ana Silva', points: 650, influence_level: 'Influente', total_refuels: 15 },
              { id: '4', display_name: 'João Pedro', points: 420, influence_level: 'Colaborador', total_refuels: 9 },
              { id: '5', display_name: 'Mariana Costa', points: 150, influence_level: 'Iniciante', total_refuels: 3 },
            ]);
          } else {
            setUsers(data); // Usa os dados reais do Supabase
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

  // ==========================================
  // 🔪 O Fatiador de Arrays (Separação de UI)
  // ==========================================
  // Por que fatiar? Porque os 3 primeiros colocados ganham um layout GIGANTE (O Pódio).
  // Do 4º em diante, é só uma lista normal. 
  // 'slice(0, 3)' pega as posições 0, 1 e 2.
  // 'slice(3)' pega da posição 3 em diante até o final.
  const top3 = users.slice(0, 3);
  const restOfUsers = users.slice(3);

  // ==========================================
  // RENDERIZAÇÃO DA TELA
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-24 relative">
      
      {/* 🔴 CABEÇALHO VERMELHO FIXO */}
      <div className="bg-primary px-4 pt-12 pb-6 rounded-b-[40px] shadow-md relative z-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground flex items-center gap-2">
              <Trophy size={24} className="text-yellow-400" /> Top Motoristas
            </h1>
            <p className="text-primary-foreground/80 text-sm font-medium mt-1">Os maiores colaboradores do FuelRank</p>
          </div>
        </div>

        {/* 🎛️ ABAS DE CATEGORIA DA COMPETIÇÃO
            O botão que estiver ativo ganha fundo branco e texto da cor primária. */}
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
          {/* ===================================== */}
          {/* 🏛️ O PÓDIO DOS CAMPEÕES (Top 3)        */}
          {/* ===================================== */}
          {/* Usamos flexbox com 'items-end' para que eles fiquem alinhados pela base.
              A ordem no HTML é 2º, 1º e 3º para que o Ouro fique no meio fisicamente! */}
          <div className="px-4 pt-8 pb-6 flex justify-center items-end gap-2 sm:gap-4 relative -mt-4">
            
            {/* 🥈 2º Lugar (Prata) - Fica na esquerda */}
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
                {/* A base do pódio (menor que o ouro) */}
                <div className="bg-slate-100 border border-slate-200 w-full pt-4 pb-2 px-1 rounded-t-xl text-center shadow-inner flex flex-col items-center">
                  <p className="text-[10px] font-bold text-foreground truncate w-full">{top3[1].display_name}</p>
                  <p className="text-xs font-bold text-slate-600">{top3[1].points} pts</p>
                </div>
              </motion.div>
            )}

            {/* 🥇 1º Lugar (Ouro) - Fica no meio, é maior e tem a coroa! */}
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
                {/* A base do pódio (a mais alta de todas - h-24) */}
                <div className="bg-gradient-to-t from-yellow-100 to-yellow-50 border border-yellow-200 w-full pt-5 pb-3 px-1 rounded-t-xl text-center shadow-[0_-5px_15px_rgba(234,179,8,0.2)] flex flex-col items-center h-24 justify-start">
                  <p className="text-xs font-bold text-foreground truncate w-full mb-0.5">{top3[0].display_name}</p>
                  <p className="text-[10px] text-yellow-700 font-bold uppercase mb-1">{top3[0].influence_level}</p>
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-black shadow-sm">
                    {top3[0].points} pts
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🥉 3º Lugar (Bronze) - Fica na direita, a base mais baixinha */}
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

          {/* ===================================== */}
          {/* 📜 LISTA DE COLOCADOS (4º em diante)    */}
          {/* ===================================== */}
          <div className="px-4 space-y-3">
            {/* O map percorre o array 'fatiado' que criamos lá em cima. */}
            {restOfUsers.map((user, index) => (
              <motion.div 
                key={user.id || index}
                initial={{ opacity: 0, x: -20 }} // Animação deslizando da esquerda pra direita
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }} // Demora um pouco pra começar, pra dar tempo do pódio aparecer primeiro!
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-4 shadow-sm"
              >
                <div className="w-8 text-center font-display font-bold text-muted-foreground text-lg">
                  {/* Como o array restOfUsers começa do índice 0 (que na verdade é o 4º lugar no banco),
                      nós somamos 'index + 4' para exibir o número correto da classificação! */}
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