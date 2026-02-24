import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock, Heart, MapPin, Navigation, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Star, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "favoritos", label: "Favoritos 💖" },
  { id: "gnv", label: "GNV" },
  { id: "gasolina_comum", label: "Gasolina" },
  { id: "etanol", label: "Etanol" },
  { id: "diesel", label: "Diesel" },
];

const Index = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados Básicos
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Sistema de Favoritos (Salva no navegador do usuário)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("fuelrank_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Estados do Filtro Avançado (O Modal)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("price"); // 'price' ou 'rating'
  const [hideReported, setHideReported] = useState(false); // Esconder postos com denúncia

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data, error } = await supabase
          .from("stations")
          .select("*, fuel_prices(*)")
          .order("created_at", { ascending: false });

        if (data) setStations(data);
      } catch (error) {
        console.error("Erro ao buscar postos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, []);

  // Função para favoritar/desfavoritar
  const toggleFavorite = (e: React.MouseEvent, stationId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavs = prev.includes(stationId) 
        ? prev.filter(id => id !== stationId) 
        : [...prev, stationId];
      
      localStorage.setItem("fuelrank_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // --- O CÉREBRO DA FILTRAGEM ---
  let processedStations = stations
    .filter(station => {
      // 1. Busca por texto
      const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            station.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Filtro de Favoritos
      if (activeFilter === "favoritos" && !favorites.includes(station.id)) return false;

      // 3. Filtro de Combustível Específico
      if (activeFilter !== "todos" && activeFilter !== "favoritos") {
        const hasFuel = station.fuel_prices?.some((fp: any) => fp.fuel_type === activeFilter);
        if (!hasFuel) return false;
      }

      // 4. Filtro Avançado: Esconder postos com denúncia
      if (hideReported && station.seal === "complaints") return false;

      return true;
    })
    .map(station => {
      // Descobre qual preço mostrar
      let displayPriceObj = null;
      if (activeFilter !== "todos" && activeFilter !== "favoritos") {
        displayPriceObj = station.fuel_prices?.find((fp: any) => fp.fuel_type === activeFilter);
      } else {
        // Padrão: GNV se tiver, se não o primeiro
        displayPriceObj = station.fuel_prices?.find((fp: any) => fp.fuel_type === 'gnv') || station.fuel_prices?.[0];
      }
      return { ...station, displayPriceObj };
    })
    .filter(station => station.displayPriceObj); // Remove postos sem preço

  // --- ORDENAÇÃO DOS POSTOS ---
  processedStations.sort((a, b) => {
    if (sortBy === "price") {
      return Number(a.displayPriceObj.price) - Number(b.displayPriceObj.price); // Do mais barato pro mais caro
    } else if (sortBy === "rating") {
      return Number(b.rating) - Number(a.rating); // Da maior nota pra menor
    }
    return 0;
  });

  // Encontra o menor preço (usado para dar a badge verde)
  const minPrice = processedStations.length > 0 
    ? Math.min(...processedStations.map(s => Number(s.displayPriceObj.price))) 
    : 0;

  const handleNavigate = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-24 relative">
      {/* Cabeçalho */}
      <div className="bg-primary px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md rounded-b-[30px]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">FuelRank</h1>
            <p className="text-primary-foreground/80 text-sm font-medium">Radar de Preços</p>
          </div>
          <button 
            onClick={() => setIsAdvancedFilterOpen(true)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm cursor-pointer hover:bg-white/30 transition-colors relative"
          >
            <SlidersHorizontal size={18} className="text-primary-foreground" />
            {/* Bolinha vermelha se tiver filtro avançado ativo */}
            {(sortBy !== 'price' || hideReported) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-primary"></span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou endereço..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner"
          />
        </div>
      </div>

      {/* Pílulas de Combustível / Favoritos */}
      <div className="px-4 py-4 sticky top-[130px] z-20 bg-secondary/30 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
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

      {/* LISTA DE POSTOS */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processedStations.length > 0 ? (
          processedStations.map((station, index) => {
            const isCheapest = Number(station.displayPriceObj.price) === minPrice;
            const isFav = favorites.includes(station.id);
            
            return (
              <motion.div 
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/station/${station.id}`)}
                className={`bg-background rounded-2xl p-4 shadow-sm border-2 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden ${
                  isCheapest && sortBy === 'price' ? "border-green-500/30" : "border-border/50"
                }`}
              >
                {/* Etiqueta Oportunidade */}
                {isCheapest && sortBy === 'price' && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Zap size={12} className="fill-white" /> Oportunidade
                  </div>
                )}

                {/* Topo do Card: Nome e Botão Coração */}
                <div className="flex justify-between items-start mb-1 pr-24">
                  <h3 className="font-display font-bold text-foreground text-base truncate">{station.name}</h3>
                </div>

                {/* Endereço e Botão de Favorito Flutuante */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate pr-4">
                    <MapPin size={12} className="text-primary/70 shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </div>
                  
                  {/* BOTÃO DE FAVORITO MÁGICO */}
                  <button 
                    onClick={(e) => toggleFavorite(e, station.id)} 
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isFav ? 'bg-red-50' : 'bg-muted/50 hover:bg-muted'}`}
                  >
                    <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                  </button>
                </div>

                <div className="h-px w-full bg-border/50 mb-4"></div>

                {/* Preços e Ações */}
                <div className="flex justify-between items-end">
                  <div>
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

                  {/* Selos e Botão Ir */}
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
      {/* MODAL DE FILTRO AVANÇADO              */}
      {/* ===================================== */}
      <AnimatePresence>
        {isAdvancedFilterOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdvancedFilterOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            
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
                
                {/* Ordem */}
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

                {/* Segurança */}
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
                    {/* Toggle Switch */}
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${hideReported ? 'bg-primary' : 'bg-muted'}`}>
                      <input type="checkbox" checked={hideReported} onChange={(e) => setHideReported(e.target.checked)} className="opacity-0 absolute w-full h-full cursor-pointer z-10" />
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${hideReported ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>

                {/* Botões de Ação */}
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