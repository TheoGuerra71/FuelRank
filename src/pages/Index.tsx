import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock, Heart, MapPin, Navigation, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Star, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 🏷️ DICIONÁRIO ESTÁTICO DE FILTROS
// Por que isso está FORA do componente Index?
// Se ficasse lá dentro, toda vez que a tela atualizasse (ex: ao digitar uma letra na busca), 
// o React recriaria essa lista na memória à toa. Deixando fora, ela é criada só uma vez 
// e economiza processamento do celular do usuário.
const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "favoritos", label: "Favoritos 💖" },
  { id: "gnv", label: "GNV" },
  { id: "gasolina_comum", label: "Gasolina" },
  { id: "etanol", label: "Etanol" },
  { id: "diesel", label: "Diesel" },
];

const Index = () => {
  // 🧭 O Hook de navegação padrão do React Router para trocarmos de tela
  const navigate = useNavigate();
  
  // ==========================================
  // ESTADOS PRINCIPAIS (Memória da Tela)
  // ==========================================
  // 'stations' guarda a resposta bruta que vem do nosso banco de dados (Supabase)
  const [stations, setStations] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true); // Controla a bolinha girando de carregamento
  
  // 🔍 Filtros que ficam visíveis o tempo todo
  const [activeFilter, setActiveFilter] = useState("todos"); // Começa mostrando tudo
  const [searchQuery, setSearchQuery] = useState(""); // Guarda o texto digitado na lupa

  // ==========================================
  // ❤️ SISTEMA DE FAVORITOS (Engenharia Local)
  // ==========================================
  // Usamos "Lazy Initialization" -> passamos uma função anônima () => {} pro useState.
  // Por que? Acessar o 'localStorage' (memória física do celular/navegador) é um processo 
  // muito mais lento que ler uma variável. Fazendo isso, o React só vai ler a memória 
  // UMA ÚNICA VEZ quando a tela abre. Se não fizéssemos assim, o app daria umas 
  // engasgadas toda vez que o usuário digitasse algo na busca.
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("fuelrank_favorites");
    return saved ? JSON.parse(saved) : []; // Transforma a string salva de volta num Array do JS
  });

  // 🎛️ Estados da Janela Flutuante (Modal de Filtros Avançados)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("price"); // O padrão é sempre ordenar do mais barato pro mais caro
  const [hideReported, setHideReported] = useState(false); // Chave de segurança para sumir com postos denunciados

  // ==========================================
  // CHAMADA DE API (Supabase)
  // ==========================================
  // Esse useEffect roda logo que a tela é montada (graças ao array vazio [] no final).
  useEffect(() => {
    const fetchStations = async () => {
      try {
        // ⚡ MÁGICA DE BANCO DE DADOS: O JOIN IMPLÍCITO DO POSTGREST
        // Nós pedimos "stations" e, na mesma frase, mandamos trazer `fuel_prices(*)`.
        // O Supabase entende que as tabelas são ligadas e já traz todos os preços 
        // embutidos dentro do objeto do posto. 
        // Em vez de fazer 1 requisição para pegar o posto e mais 5 para pegar os preços,
        // matamos tudo em 1 requisição só! Otimização monstra.
        const { data, error } = await supabase
          .from("stations")
          .select("*, fuel_prices(*)")
          .order("created_at", { ascending: false }); // Traz os mais novos primeiro

        if (data) setStations(data);
      } catch (error) {
        console.error("Erro ao buscar postos:", error);
      } finally {
        setIsLoading(false); // Desliga o "Carregando..."
      }
    };
    fetchStations();
  }, []);

  // ==========================================
  // INTERAÇÕES DE CLIQUE
  // ==========================================

  // Função disparada ao clicar no coraçãozinho
  const toggleFavorite = (e: React.MouseEvent, stationId: string) => {
    // 🛡️ O ESCUDO DE CLIQUE (e.stopPropagation):
    // Na nossa interface, o botão de Favoritar fica DENTRO do cartão do posto.
    // O cartão inteiro já tem um 'onClick' que te joga pra página de detalhes.
    // Se não usarmos o stopPropagation, o clique no coração "vazaria" pro cartão de baixo
    // e o usuário seria jogado pra outra tela acidentalmente.
    e.stopPropagation(); 
    
    setFavorites((prev) => {
      // Regra de ouro do React: Nunca altere um array diretamente. Crie um novo.
      // Se o ID já tá lá, removemos (desfavorita). Se não tá, espalhamos os antigos (...prev) e adicionamos o novo.
      const newFavs = prev.includes(stationId) 
        ? prev.filter(id => id !== stationId) 
        : [...prev, stationId];
      
      // Salva no navegador pra lembrar amanhã se o cara fechar o app
      localStorage.setItem("fuelrank_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Abre o app de GPS (Google Maps) pra traçar a rota
  const handleNavigate = (e: React.MouseEvent, address: string) => {
    e.stopPropagation(); // Outro escudo pelo mesmo motivo! (O botão IR tá dentro do card)
    
    // 🔗 encodeURIComponent: Se o endereço for "Av. João XXIII", ele transforma 
    // os espaços e acentos em códigos (Ex: Av.%20Jo%C3%A3o) pra URL do Google não quebrar.
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=$${encodedAddress}`, '_blank');
  };

  // ==========================================
  // 🧠 A FÁBRICA DE DADOS (Frontend Pipeline)
  // ==========================================
  // Aqui pegamos a lista bruta e aplicamos as regras em tempo real no celular da pessoa.
  
  let processedStations = stations
    .filter(station => {
      // PASSO 1: O que ele digitou bate com o nome ou endereço do posto? (Transforma tudo em minúsculo pra comparar)
      const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            station.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // PASSO 2: O cara tá na aba de favoritos? Se sim, só passa quem tem o ID salvo no localStorage.
      if (activeFilter === "favoritos" && !favorites.includes(station.id)) return false;

      // PASSO 3: O cara clicou em "Etanol" lá em cima? 
      if (activeFilter !== "todos" && activeFilter !== "favoritos") {
        // O '.some()' checa se existe pelo menos um preço daquele combustível cadastrado pra esse posto.
        const hasFuel = station.fuel_prices?.some((fp: any) => fp.fuel_type === activeFilter);
        if (!hasFuel) return false; // Se não tem esse combustível, tchau posto.
      }

      // PASSO 4: Filtro de Segurança do Painel Avançado
      if (hideReported && station.seal === "complaints") return false;

      // Se sobreviveu a essa maratona de "ifs", o posto merece ir pra tela.
      return true;
    })
    .map(station => {
      // 💡 ESCOLHENDO O PREÇO ESTRELA: Qual preço vai ficar gigante no card?
      let displayPriceObj = null;
      
      if (activeFilter !== "todos" && activeFilter !== "favoritos") {
        // Se a pessoa filtrou por "Diesel", eu DEVO mostrar o valor do Diesel no card!
        displayPriceObj = station.fuel_prices?.find((fp: any) => fp.fuel_type === activeFilter);
      } else {
        // Se ele tá vendo "Todos", eu tento mostrar o GNV primeiro (pois é o foco do motorista de app).
        // Se esse posto não tiver GNV, o '||' joga o primeiro combustível que ele achar no array (índice [0]).
        displayPriceObj = station.fuel_prices?.find((fp: any) => fp.fuel_type === 'gnv') || station.fuel_prices?.[0];
      }
      
      // Embute a nossa escolha final dentro do objeto do posto e manda pra frente.
      return { ...station, displayPriceObj };
    })
    // Proteção de segurança: Vai que um posto acabou de ser criado e o dono não cadastrou preço nenhum ainda?
    // Removemos ele da tela para não quebrar a interface tentando mostrar um preço que não existe.
    .filter(station => station.displayPriceObj); 

  // ==========================================
  // 🔄 ORDENAÇÃO MATEMÁTICA
  // ==========================================
  // O 'sort' muda o array processado diretamente (mutação local é ok aqui).
  processedStations.sort((a, b) => {
    if (sortBy === "price") {
      // (a - b) organiza do menor para o maior (Crescente)
      return Number(a.displayPriceObj.price) - Number(b.displayPriceObj.price); 
    } else if (sortBy === "rating") {
      // (b - a) organiza do maior para o menor (Decrescente) - Porque queremos ver os postos Nota 5.0 primeiro!
      return Number(b.rating) - Number(a.rating); 
    }
    return 0;
  });

  // ==========================================
  // 🏆 DESCOBRINDO O MAIS BARATO DO BAIRRO
  // ==========================================
  // Pega todos os preços que sobraram na tela, extrai só o número e acha o menor (Math.min).
  // Se o posto tiver exatamente esse preço, ele ganha a tarja verde de "Oportunidade" lá no HTML.
  const minPrice = processedStations.length > 0 
    ? Math.min(...processedStations.map(s => Number(s.displayPriceObj.price))) 
    : 0;


  // ==========================================
  // INÍCIO DO HTML (A Interface Gráfica)
  // ==========================================
  return (
    <div className="min-h-screen bg-secondary/30 pb-24 relative">
      
      {/* 🔴 CABEÇALHO FIXO VERMELHO */}
      <div className="bg-primary px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md rounded-b-[30px]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">FuelRank</h1>
            <p className="text-primary-foreground/80 text-sm font-medium">Radar de Preços</p>
          </div>
          
          {/* BOTÃO PARA ABRIR O FILTRO AVANÇADO */}
          <button 
            onClick={() => setIsAdvancedFilterOpen(true)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm cursor-pointer hover:bg-white/30 transition-colors relative"
          >
            <SlidersHorizontal size={18} className="text-primary-foreground" />
            
            {/* O ALERTA VERMELHO: Só aparece pra avisar o usuário que tem algum filtro secreto ativo alterando a lista */}
            {(sortBy !== 'price' || hideReported) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-primary"></span>
            )}
          </button>
        </div>

        {/* 🔍 A BARRA DE PESQUISA */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou endereço..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Vincula a caixa de texto ao nosso Estado lá em cima
            className="w-full bg-background border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner"
          />
        </div>
      </div>

      {/* 💊 SCROLL LATERAL DOS FILTROS RÁPIDOS (Pílulas) */}
      <div className="px-4 py-4 sticky top-[130px] z-20 bg-secondary/30 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              // O Tailwind puro brilho: Se estiver selecionado, muda a cor pra dar destaque.
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                activeFilter === filter.id 
                  ? filter.id === 'favoritos' ? "bg-red-500 text-white scale-105" : "bg-foreground text-background scale-105" 
                  : "bg-background text-muted-foreground border border-border/50 hover:bg-muted"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-medium">
          {processedStations.length} {processedStations.length === 1 ? 'posto encontrado' : 'postos encontrados'}
        </p>
      </div>

      {/* 📋 O GERADOR DE CARTÕES (A Lista de Postos) */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processedStations.length > 0 ? (
          
          processedStations.map((station, index) => {
            // Analisa o posto atual pra saber se pinta ele com a cor do "Mais Barato"
            const isCheapest = Number(station.displayPriceObj.price) === minPrice;
            // Analisa se esse posto tá na nossa lista de corações salvos
            const isFav = favorites.includes(station.id);
            
            return (
              <motion.div 
                key={station.id}
                initial={{ opacity: 0, y: 20 }} // Começa invísivel e 20px abaixo do normal
                animate={{ opacity: 1, y: 0 }}  // Desliza pro lugar certo ficando 100% visível
                transition={{ delay: index * 0.05 }} // Efeito Dominó: O 1º card demora 0s, o 2º demora 0.05s, o 3º demora 0.10s... Fica lindão.
                onClick={() => navigate(`/station/${station.id}`)}
                className={`bg-background rounded-2xl p-4 shadow-sm border-2 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden ${
                  isCheapest && sortBy === 'price' ? "border-green-500/30" : "border-border/50"
                }`}
              >
                {/* 🤑 A TARJA DE OPORTUNIDADE (Só aparece no cara que é o mais barato e se a lista for por Preço) */}
                {isCheapest && sortBy === 'price' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Zap size={12} className="fill-white" /> Oportunidade
                  </div>
                )}

                <div className="flex justify-between items-start mb-1 pr-24">
                  <h3 className="font-display font-bold text-foreground text-base truncate">{station.name}</h3>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate pr-4">
                    <MapPin size={12} className="text-primary/70 shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </div>
                  
                  {/* ❤️ O BOTÃO DE CORAÇÃO (Se estiver favoritado, pinta o interior de vermelho) */}
                  <button 
                    onClick={(e) => toggleFavorite(e, station.id)} 
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isFav ? 'bg-red-50' : 'bg-muted/50 hover:bg-muted'}`}
                  >
                    <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                  </button>
                </div>

                <div className="h-px w-full bg-border/50 mb-4"></div>

                {/* 💸 A ÁREA DE PRECIFICAÇÃO E AÇÃO */}
                <div className="flex justify-between items-end">
                  <div>
                    {/* Exibe qual combustível aquele preço gigante se refere. O replace tira o _ (ex: gasolina_comum vira gasolina comum) */}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {station.displayPriceObj.fuel_type.replace('_', ' ')}
                    </p>
                    <div className="flex items-start gap-1">
                      <span className="text-sm font-bold text-foreground mt-1">R$</span>
                      <span className="font-display text-4xl font-bold tracking-tighter text-foreground">
                        {Number(station.displayPriceObj.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted w-fit px-1.5 py-0.5 rounded">
                        <Clock size={10} /> Hoje
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                        <Star size={10} className="fill-yellow-600" /> {Number(station.rating).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* 🛡️ OS SELOS DE CONFIANÇA */}
                  <div className="flex flex-col items-end gap-2">
                    {station.seal === 'trusted' ? (
                      <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold">
                        <ShieldCheck size={12} /> Confiável
                      </div>
                    ) : station.seal === 'complaints' ? (
                      <div className="flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-2 py-1 rounded-full font-bold">
                        <AlertTriangle size={12} /> Denúncias
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-warning bg-warning/10 px-2 py-1 rounded-full font-bold">
                        <ShieldAlert size={12} /> Em Observação
                      </div>
                    )}

                    {/* BOTÃO NAVEGAR */}
                    <button 
                      onClick={(e) => handleNavigate(e, station.address)}
                      className="bg-foreground text-background font-bold text-sm px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-foreground/90 active:scale-95 transition-transform shadow-md"
                    >
                      <Navigation size={16} className="fill-background" />
                      Ir
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          /* 👻 TELA VAZIA (Empty State) - Muito importante para não deixar a tela em branco se não achar nada */
          <div className="text-center py-20 px-6 bg-background rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              {activeFilter === 'favoritos' ? <Heart size={24} className="text-muted-foreground" /> : <MapPin size={24} className="text-muted-foreground" />}
            </div>
            <h3 className="font-bold text-foreground mb-2">Nenhum posto encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'favoritos' 
                ? "Você ainda não favoritou nenhum posto. Clique no coração para salvar seus postos preferidos!" 
                : "Tente mudar o filtro ou remover opções na busca."}
            </p>
          </div>
        )}
      </div>

      <BottomNav />

      {/* ===================================== */}
      {/* 🎛️ MODAL DO FILTRO AVANÇADO         */}
      {/* ===================================== */}
      {/* O AnimatePresence avisa o React: "Não destrua o elemento na hora! Espera a animação de saída dele acabar." */}
      <AnimatePresence>
        {isAdvancedFilterOpen && (
          <>
            {/* O Pano de Fundo Borrado (Backdrop). Clicou nele, o Modal se autodestrói (isAdvancedFilterOpen = false) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdvancedFilterOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            
            {/* O Modal real que sobe do rodapé (Bottom Sheet) */}
            <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 p-6">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-primary" /> Refinar Busca
                </h3>
                <button onClick={() => setIsAdvancedFilterOpen(false)} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground active:scale-95">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-6">
                
                {/* 🔄 Escolha da Métrica da Ordenação */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Ordenar Lista Por</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSortBy('price')}
                      className={`py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-between border-2 transition-all ${sortBy === 'price' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-foreground hover:bg-muted'}`}
                    >
                      Menor Preço
                      {sortBy === 'price' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                    <button
                      onClick={() => setSortBy('rating')}
                      className={`py-3 px-3 rounded-xl text-sm font-bold flex items-center justify-between border-2 transition-all ${sortBy === 'rating' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-transparent text-foreground hover:bg-muted'}`}
                    >
                      Melhor Avaliação
                      {sortBy === 'rating' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                  </div>
                </div>

                <hr className="border-border" />

                {/* 🛡️ Switch de Segurança Anti-Fraude */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Segurança e Qualidade</label>
                  <label className="flex items-center justify-between bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">Esconder postos suspeitos</p>
                        <p className="text-[10px] text-muted-foreground">Oculta postos com índice de fraude</p>
                      </div>
                    </div>
                    {/* A engenharia de um botão iOS feito no Tailwind! 
                        Se hideReported é true, empurra a bolinha branca 24px pra direita (translate-x-6) e pinta o fundo de vermelho. */}
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${hideReported ? 'bg-primary' : 'bg-muted'}`}>
                      <input type="checkbox" checked={hideReported} onChange={(e) => setHideReported(e.target.checked)} className="opacity-0 absolute w-full h-full cursor-pointer z-10" />
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${hideReported ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>

                {/* 🔘 Ações de Conclusão */}
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => { setSortBy('price'); setHideReported(false); setIsAdvancedFilterOpen(false); }} 
                    className="flex-1 py-4 rounded-xl font-bold text-sm bg-muted text-foreground hover:bg-muted/80 active:scale-95 transition-transform"
                  >
                    Restaurar
                  </button>
                  <button 
                    onClick={() => setIsAdvancedFilterOpen(false)} 
                    className="flex-[2] py-4 rounded-xl font-bold text-sm bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
                  >
                    Aplicar Filtros
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

export default Index;