import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, Car, ChevronRight, Flame, LogOut, MapPin, PlusCircle, Settings, Shield, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 👤 TELA DE PERFIL: O QG do Motorista
// Aqui mostramos quem ele é, quantos pontos tem no FuelRank e a garagem dele.
const Profile = () => {
  // 🧠 Contexto de Autenticação (Acesso à função de deslogar)
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // ==========================================
  // ESTADOS GERAIS (A Memória da Tela)
  // ==========================================
  // 'profile' guarda os dados do usuário (nome, pontos, nível) vindos do banco
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🎛️ Controles dos Modais (Janelas Flutuantes)
  // Eles começam como 'false' (escondidos). Quando clicados, viram 'true' e aparecem na tela.
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 📝 Estados do Formulário de "Adicionar Carro"
  const [newCarName, setNewCarName] = useState("");
  const [newCarType, setNewCarType] = useState("Flex");

  // 🚗 Garagem Virtual
  // Uma lista de carros. Mais pra frente, isso pode vir do banco de dados igual o perfil.
  const [cars, setCars] = useState([
    { id: 1, name: "Chevrolet Spin Activ 2016", type: "GNV / Flex" },
    { id: 2, name: "Fiat Grand Siena 2017", type: "Flex" }
  ]);

  // ==========================================
  // BUSCA DE DADOS (Ao abrir a tela)
  // ==========================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // PASSO 1: Descobre QUEM é o usuário que está segurando o celular agora
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // PASSO 2: Vai na tabela 'profiles', procura a linha que tem o ID dele e traz os dados (.single())
          const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          setProfile(data);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ==========================================
  // FUNÇÕES DE AÇÃO DO USUÁRIO
  // ==========================================

  // 🚪 Função de Sair do App
  const handleLogout = async () => {
    await signOut(); // Limpa a sessão no Supabase (Destrói o token de acesso)
    navigate("/auth"); // Chuta o cara de volta pra tela de Login
  };

  // ➕ Função disparada ao clicar no botão "Salvar Veículo" dentro do Modal
  const handleAddCar = (e: React.FormEvent) => {
    e.preventDefault(); // Impede o "Refresh" da página
    if (!newCarName) return; // Se ele não digitou o nome, não faz nada
    
    // Matemática simples para criar um ID novo (pega o maior ID existente e soma 1)
    const newId = cars.length > 0 ? Math.max(...cars.map(c => c.id)) + 1 : 1;
    
    // Atualiza a garagem! Pega a lista de carros antiga (...cars) e gruda o carro novo no final
    setCars([...cars, { id: newId, name: newCarName, type: newCarType }]);
    
    // Depois de salvar, fazemos a "Faxina": limpa o formulário e fecha a janela flutuante
    setNewCarName("");
    setNewCarType("Flex");
    setIsCarModalOpen(false);
  };

  // Se o Supabase ainda está pensando, mostramos uma tela de espera para não quebrar a interface
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando perfil...</div>;
  }

  // ==========================================
  // 🎮 GAMIFICAÇÃO: A Matemática dos Pontos
  // ==========================================
  // Pega os pontos do banco. Se por algum motivo vier vazio (null), assume que é 0.
  const currentPoints = profile?.points || 0;
  const nextLevelPoints = 500; // Meta fixa para evoluir pro próximo rank
  
  // Calcula a porcentagem da barra de progresso (nunca deixa passar de 100%)
  const progressPercent = Math.min((currentPoints / nextLevelPoints) * 100, 100);

  // ==========================================
  // RENDERIZAÇÃO DA TELA
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-24 relative">
      
      {/* 🔴 CABEÇALHO SUPERIOR (O Cartão de Visitas) */}
      <div className="bg-primary px-4 pt-12 pb-24 relative rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-xl font-bold text-primary-foreground">Meu Perfil</h1>
          
          {/* Botão de Engrenagem (Abre o Modal de Configurações) */}
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors active:scale-95">
            <Settings size={22} />
          </button>
        </div>
        
        {/* AVATAR E NOME */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-background border-4 border-primary-foreground/20 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-display font-bold text-primary">
              {/* Fallback inteligente: Pega a 1ª letra do nome do cara e deixa maiúscula. Se não tiver nome, exibe 'U' de Usuário. */}
              {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">{profile?.display_name || "Usuário FuelRank"}</h2>
            <div className="flex items-center gap-1.5 mt-1 bg-black/20 px-2.5 py-1 rounded-full w-fit backdrop-blur-sm">
              <Trophy size={12} className="text-yellow-400" />
              <span className="text-xs font-medium text-primary-foreground/90">{profile?.influence_level || "Iniciante"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (Sobe um pouco por cima do cabeçalho vermelho pra dar aquele efeito 3D) */}
      <div className="px-4 -mt-16 relative z-10 space-y-6">
        
        {/* 🏅 CARTÃO DE PROGRESSO (A Gamificação) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Seus Pontos</p>
              <h3 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                {currentPoints} <Flame size={20} className="text-orange-500" />
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Próximo Nível</p>
              <p className="text-sm font-bold text-foreground">Colaborador</p>
            </div>
          </div>
          
          {/* BARRA DE PROGRESSO ANIMADA */}
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden mt-4">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} // Injeta o cálculo matemático ali de cima no CSS!
              transition={{ duration: 1, delay: 0.2 }} 
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full" 
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">Faltam {nextLevelPoints - currentPoints} pts para evoluir</p>
        </motion.div>

        {/* 📊 GRADE DE ESTATÍSTICAS (O que o usuário já fez no app) */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card p-4 rounded-xl border border-border flex flex-col gap-2 shadow-sm">
            <MapPin size={20} className="text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{profile?.total_refuels || 0}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Abastecimentos</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card p-4 rounded-xl border border-border flex flex-col gap-2 shadow-sm">
            <AlertTriangle size={20} className="text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Fraudes Evitadas</p>
            </div>
          </motion.div>
        </div>

        {/* 🚗 MINHA GARAGEM */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Car size={18} className="text-primary" /> Minha Garagem
            </h3>
            {/* O Gatilho do Modal: Ao clicar, a variável isCarModalOpen vira TRUE */}
            <button onClick={() => setIsCarModalOpen(true)} className="text-xs font-bold text-primary hover:underline active:scale-95">
              Adicionar
            </button>
          </div>
          
          <div className="space-y-2">
            {/* O famoso 'map' desenhando a lista de carros baseada na variável de estado lá de cima */}
            {cars.map((car) => (
              <div key={car.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-sm hover:border-primary">
                <div>
                  <p className="font-semibold text-sm text-foreground">{car.name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{car.type}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ⚙️ ÁREA ADMINISTRATIVA / LOGOUT */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setIsSettingsModalOpen(true)} className="w-full p-4 flex items-center justify-between border-b border-border hover:bg-muted/50 transition-colors active:bg-muted">
              <span className="font-medium text-sm text-foreground flex items-center gap-2">
                <Shield size={16} className="text-muted-foreground" /> Privacidade e Dados
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            
            {/* Botão de Fuga: Chama a função handleLogout (que usa o Contexto de Auth pra deslogar o cara) */}
            <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors active:bg-destructive/10">
              <span className="font-medium text-sm text-destructive flex items-center gap-2">
                <LogOut size={16} /> Sair da conta
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Menu Fixo do Rodapé */}
      <BottomNav />

      {/* ========================================= */}
      {/* 🚀 JANELAS FLUTUANTES (MODAIS)           */}
      {/* ========================================= */}
      {/* AnimatePresence é essencial pra janela poder fazer uma animação bonitinha antes de fechar */}
      <AnimatePresence>
        
        {/* ============================== */}
        {/* MODAL 1: ADICIONAR CARRO NOVO  */}
        {/* ============================== */}
        {/* Só existe na tela se isCarModalOpen for true! */}
        {isCarModalOpen && (
          <>
            {/* O Fundo Escuro Borrado. Clicou nele, o modal fecha (isCarModalOpen = false) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCarModalOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            
            {/* A Janela Estilo iFood (Sobe do rodapé) */}
            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 p-6">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2"><Car className="text-primary" /> Novo Veículo</h3>
                <button onClick={() => setIsCarModalOpen(false)} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              
              {/* O Formulário de Criação. Quando dá "Submit", ele ataca a função handleAddCar lá no topo */}
              <form onSubmit={handleAddCar} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Modelo do Carro</label>
                  <input type="text" value={newCarName} onChange={(e) => setNewCarName(e.target.value)} placeholder="Ex: Honda Civic 2022" className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-colors" required autoFocus />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo de Combustível</label>
                  <select value={newCarType} onChange={(e) => setNewCarType(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-colors">
                    <option value="Flex">Flex (Etanol/Gasolina)</option>
                    <option value="GNV">GNV</option>
                    <option value="GNV / Flex">GNV / Flex</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina">Apenas Gasolina</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-foreground text-background font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] mt-2">
                  <PlusCircle size={18} /> Salvar Veículo
                </button>
              </form>
            </motion.div>
          </>
        )}

        {/* ============================== */}
        {/* MODAL 2: CONFIGURAÇÕES E DADOS */}
        {/* ============================== */}
        {/* Mesma lógica do modal de cima, mas esse aparece no centro da tela (scale) */}
        {isSettingsModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsModalOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Settings size={18} className="text-primary"/> Configurações</h3>
                <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="p-5 space-y-5">
                
                {/* Módulo de Notificações */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Bell size={18} /></div>
                    <div>
                      <p className="font-semibold text-sm">Notificações</p>
                      <p className="text-[10px] text-muted-foreground">Avisos de preços baixos</p>
                    </div>
                  </div>
                  {/* Um botão de toggle visual desenhado na mão com Tailwind (A bolinha branca em cima do fundo vermelho) */}
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full shadow-sm"></div>
                  </div>
                </div>
                
                <hr className="border-border" />
                
                {/* Política de Privacidade */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Shield size={16} className="text-primary"/> Privacidade</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Seus dados de abastecimento são anônimos e usados exclusivamente para alimentar o ranking de postos e proteger a comunidade contra fraudes no GNV e líquidos.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Profile;