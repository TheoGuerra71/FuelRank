import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, Filter, Fuel, PlusCircle, Receipt, TrendingDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 📊 TELA DE HISTÓRICO: O "Extrato Bancário" do motorista.
// Aqui ele controla quanto gastou em combustível e vê o impacto financeiro no mês.
const RefuelHistory = () => {
  const navigate = useNavigate();
  
  // ==========================================
  // ESTADOS PRINCIPAIS (Memória)
  // ==========================================
  const [refuels, setRefuels] = useState<any[]>([]); // Lista bruta de abastecimentos vindos do banco
  const [isLoading, setIsLoading] = useState(true);

  // 🎛️ Estados do Modal de Filtro
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterFuel, setFilterFuel] = useState("all"); // 'gnv', 'gasolina', etc.
  const [filterPeriod, setFilterPeriod] = useState("all"); // '7' (dias), '30' (dias) ou 'all'

  // ==========================================
  // BUSCA DE DADOS (Ao abrir a tela)
  // ==========================================
  useEffect(() => {
    const fetchRefuels = async () => {
      try {
        // 1. Descobre quem é o motorista logado agora
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Busca todos os abastecimentos DESSA PESSOA.
        // O `stations(name)` é o join implícito do Supabase: em vez de trazer só "station_id: 12",
        // ele já vai lá na tabela de postos e traz "Posto Ipiranga Centro" atrelado ao registro.
        const { data } = await supabase
          .from("refuels")
          .select("*, stations(name)")
          .eq("user_id", user.id)
          .order("date", { ascending: false }); // O mais recente primeiro (tipo feed do Insta)

        if (data) setRefuels(data);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRefuels();
  }, []);

  // ==========================================
  // 🧠 O CÉREBRO DA FILTRAGEM (Frontend Pipeline)
  // ==========================================
  // Novamente, filtramos no frontend (memória do celular) para ser instantâneo e não gastar servidor.
  const filteredRefuels = refuels.filter((refuel) => {
    
    // REGRA 1: Filtro de Combustível
    // Se não for "todos" E o combustível desse abastecimento for diferente do filtro, esconde ele!
    if (filterFuel !== "all" && refuel.fuel_type !== filterFuel) return false;
    
    // REGRA 2: Filtro de Tempo (A matemática dos dias)
    if (filterPeriod !== "all") {
      const refuelDate = new Date(refuel.date); // Transforma a data do banco numa Data de verdade no JS
      const today = new Date();
      
      // Matemática temporal: Pega a diferença em milissegundos e converte para DIAS.
      const diffTime = Math.abs(today.getTime() - refuelDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Se eu pedi "Últimos 7 dias" e o abastecimento tem 10 dias, esconde ele!
      if (filterPeriod === "7" && diffDays > 7) return false;
      if (filterPeriod === "30" && diffDays > 30) return false;
    }
    
    return true; // Se sobreviveu, mostra na tela.
  });

  // ==========================================
  // 💰 O MOTOR FINANCEIRO (Cálculos de Totais)
  // ==========================================
  // ATENÇÃO: Os cálculos rodam em cima da lista FILTRADA (`filteredRefuels`), não da lista bruta.
  // Ou seja: Se o cara filtrou "Últimos 7 dias", o "Total Gasto" lá em cima vai somar SÓ os últimos 7 dias!
  
  // '.reduce' é um loop que acumula valores. Pega o preço total de cada registro e vai somando (começando do 0).
  const totalGasto = filteredRefuels.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const totalAbastecimentos = filteredRefuels.length;

  // 📦 Separação de Custos por Tipo (Para o visual dos quadradinhos)
  // Filtramos os do tipo "gnv" e somamos. Repetimos para os outros.
  const gastoGNV = filteredRefuels.filter(r => r.fuel_type === 'gnv').reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  
  // Detalhe: Gasolina pode ser 'gasolina_comum' ou 'aditivada', por isso o '.includes' captura qualquer uma.
  const gastoGasolina = filteredRefuels.filter(r => r.fuel_type?.includes('gasolina')).reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const gastoEtanol = filteredRefuels.filter(r => r.fuel_type === 'etanol').reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const gastoDiesel = filteredRefuels.filter(r => r.fuel_type === 'diesel').reduce((acc, curr) => acc + (curr.total_price || 0), 0);

  // Variável rápida pra saber se a bolinha vermelha de alerta no botão de filtro tem que aparecer.
  const hasActiveFilters = filterFuel !== "all" || filterPeriod !== "all";

  // ==========================================
  // RENDERIZAÇÃO DA TELA
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-24 relative">
      
      {/* 📌 CABEÇALHO FIXO (Top Bar) */}
      <div className="bg-card border-b border-border pt-12 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="px-4 flex justify-between items-center mb-5">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Meu Histórico</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {/* O truque do toLocaleDateString: Pega o dia de hoje e já traduz pra "fevereiro de 2026" */}
              <Calendar size={12} /> {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' ')}
            </p>
          </div>
          
          {/* BOTÃO DO FILTRO */}
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="relative p-2.5 text-foreground hover:bg-muted transition-colors bg-secondary/50 rounded-xl active:scale-95 border border-border"
          >
            <Filter size={18} />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
            )}
          </button>
        </div>

        {/* 💳 DASHBOARD FINANCEIRO (O Cartão Laranja Principal) */}
        <div className="px-4">
          <div className="bg-gradient-to-br from-primary to-orange-500 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-primary-foreground relative overflow-hidden">
            {/* Decorações do fundo do cartão pra dar um ar "Nubank/C6" */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-primary-foreground/70 mb-1 uppercase tracking-widest">Total Gasto</p>
                <h2 className="font-display text-4xl font-bold tracking-tight flex items-start gap-1">
                  <span className="text-lg opacity-80 mt-1">R$</span>
                  {/* Se for mais de R$ 0, exibe bonitinho com a vírgula do padrão brasileiro */}
                  {totalGasto > 0 ? totalGasto.toFixed(2).replace('.', ',') : "0,00"}
                </h2>
              </div>
              <div className="bg-black/20 px-2.5 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 border border-white/10 shadow-sm">
                <TrendingDown size={14} className="text-green-400" />
                <span className="text-xs font-bold text-green-50">Econômico</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧊 CUBOS DE GASTOS INDIVIDUAIS (Barra Horizontal Deslizável) */}
        <div className="mt-4 px-4 flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {/* Cada quadradinho consome a matemática individual (gastoGNV, gastoGasolina) que fizemos lá em cima! */}
          <div className="bg-background border border-border rounded-xl p-3 min-w-[110px] shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-[0.03]"><Fuel size={40} /></div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">GNV</p>
            <p className="font-bold text-foreground text-sm">R$ {gastoGNV.toFixed(2).replace('.', ',')}</p>
          </div>
          
          <div className="bg-background border border-border rounded-xl p-3 min-w-[110px] shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-[0.03]"><Fuel size={40} /></div>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Gasolina</p>
            <p className="font-bold text-foreground text-sm">R$ {gastoGasolina.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="bg-background border border-border rounded-xl p-3 min-w-[110px] shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-[0.03]"><Fuel size={40} /></div>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Etanol</p>
            <p className="font-bold text-foreground text-sm">R$ {gastoEtanol.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="bg-background border border-border rounded-xl p-3 min-w-[110px] shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-[0.03]"><Fuel size={40} /></div>
            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-1">Diesel</p>
            <p className="font-bold text-foreground text-sm">R$ {gastoDiesel.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </div>

      {/* 📜 LISTA DE LANÇAMENTOS (O "Extrato") */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Receipt size={18} className="text-primary" /> Lançamentos
          </h3>
          {/* Se a bolinha vermelha tiver acesa, mostramos esse texto 'Filtrado' pra pessoa não achar que os outros registros sumiram pra sempre. */}
          {hasActiveFilters && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">
              Filtrado
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Buscando dados...
          </div>
        ) : filteredRefuels.length > 0 ? (
          <div className="space-y-3">
            {/* O map para gerar as linhas do extrato */}
            {filteredRefuels.map((refuel, i) => (
              <motion.div 
                key={refuel.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }} // O famoso efeito cascatinha
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-primary/50 transition-colors"
              >
                {/* Ícone Dinâmico: GNV é Azulzinho, resto é Laranjinha */}
                <div className={`p-3 rounded-full flex-shrink-0 ${refuel.fuel_type === 'gnv' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <Fuel size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate">{refuel.stations?.name || "Posto Desconhecido"}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(refuel.date).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span className="uppercase text-primary/80 font-bold">{refuel.fuel_type.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-foreground">R$ {refuel.total_price?.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[10px] text-muted-foreground font-medium bg-secondary px-1.5 py-0.5 rounded inline-block mt-1">
                    {/* Se for GNV é m³, se for resto é L (Litro) */}
                    {refuel.volume} {refuel.fuel_type === 'gnv' ? 'm³' : 'L'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* 👻 TELA VAZIA (Sem Abastecimentos) */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border-2 border-border border-dashed rounded-2xl p-8 text-center shadow-sm mt-2">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Receipt size={28} className="text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <PlusCircle size={16} className="text-primary" />
              </div>
            </div>
            <h3 className="font-bold text-foreground mb-2">Nenhum registro encontrado</h3>
            
            {/* O texto muda se a culpa de estar vazio for porque o filtro tá muito restrito, ou se for porque ele não cadastrou nada ainda */}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {hasActiveFilters 
                ? "Não encontramos abastecimentos com os filtros atuais. Tente limpar os filtros." 
                : "Você ainda não tem abastecimentos. Registre seu primeiro para começar a ganhar pontos!"}
            </p>
            
            {/* O Botão muda de acordo com o texto acima! */}
            {hasActiveFilters ? (
              <button onClick={() => { setFilterFuel("all"); setFilterPeriod("all"); }} className="text-sm font-bold text-primary underline active:scale-95">
                Limpar Filtros
              </button>
            ) : (
              <button onClick={() => navigate("/")} className="bg-foreground text-background font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 mx-auto hover:bg-foreground/90 transition-colors active:scale-95 shadow-md">
                <PlusCircle size={18} /> Cadastrar Abastecimento
              </button>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav />

      {/* ===================================== */}
      {/* 🎛️ MODAL DO FILTRO                   */}
      {/* ===================================== */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterModalOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 p-6">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Filter size={20} className="text-primary" /> Filtrar Histórico
                </h3>
                <button onClick={() => setIsFilterModalOpen(false)} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground active:scale-95">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-6">
                
                {/* ⛽ Filtro de Combustível */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Combustível</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'gnv', 'gasolina_comum', 'etanol'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterFuel(type)}
                        className={`py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-between border-2 transition-all ${filterFuel === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-muted-foreground hover:bg-muted'}`}
                      >
                        {type === 'all' ? 'Todos' : type === 'gasolina_comum' ? 'Gasolina' : type.toUpperCase()}
                        {/* Um Checkmark maroto aparece se o item tiver selecionado */}
                        {filterFuel === type && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📅 Filtro de Tempo (Período) */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Período</label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: 'Todo o Histórico' },
                      { id: '7', label: 'Últimos 7 dias' },
                      { id: '30', label: 'Últimos 30 dias' }
                    ].map((period) => (
                      <button
                        key={period.id}
                        onClick={() => setFilterPeriod(period.id)}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-between border-2 transition-all ${filterPeriod === period.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-foreground hover:bg-muted'}`}
                      >
                        {period.label}
                        {filterPeriod === period.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botões do Modal */}
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => { setFilterFuel("all"); setFilterPeriod("all"); setIsFilterModalOpen(false); }} 
                    className="flex-1 py-4 rounded-xl font-bold text-sm bg-muted text-foreground hover:bg-muted/80 active:scale-95 transition-transform"
                  >
                    Limpar
                  </button>
                  <button 
                    onClick={() => setIsFilterModalOpen(false)} 
                    className="flex-[2] py-4 rounded-xl font-bold text-sm bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
                  >
                    Ver Resultados
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RefuelHistory;