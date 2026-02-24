import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Fuel, History, MapPin, Navigation, Search, Star, TrendingDown, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Categorias Visuais para o modo "Explorar"
const CATEGORIES = [
  { id: 'gnv', label: 'GNV', icon: <Fuel size={24} className="text-blue-500"/>, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600' },
  { id: 'gasolina', label: 'Gasolina', icon: <Fuel size={24} className="text-orange-500"/>, bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-600' },
  { id: 'etanol', label: 'Etanol', icon: <Fuel size={24} className="text-green-500"/>, bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-600' },
  { id: 'diesel', label: 'Diesel', icon: <Fuel size={24} className="text-stone-500"/>, bg: 'bg-stone-500/10', border: 'border-stone-500/20', text: 'text-stone-600' },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados da Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("price"); // 'price' ou 'rating'
  
  // Histórico de Buscas Corrigido
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("fuelrank_recent_searches");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data } = await supabase
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

  const handleSaveSearch = (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
      localStorage.setItem("fuelrank_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Botão X corrigido com stopPropagation e preventDefault
  const removeRecentSearch = (e: React.MouseEvent, queryToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== queryToRemove);
      localStorage.setItem("fuelrank_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Lógica de Filtragem Rica
  let processedStations = stations
    .filter(station => {
      if (!searchQuery) return false;
      
      const query = searchQuery.toLowerCase();
      const matchesName = station.name.toLowerCase().includes(query);
      const matchesAddress = station.address.toLowerCase().includes(query);
      const matchesBrand = station.brand?.toLowerCase().includes(query);
      const matchesFuel = station.fuel_prices?.some((fp: any) => fp.fuel_type.toLowerCase().includes(query));
      
      return matchesName || matchesAddress || matchesBrand || matchesFuel;
    })
    .map(station => {
      const displayPriceObj = station.fuel_prices?.reduce((min: any, current: any) => {
        if (!min) return current;
        // Se o usuário buscou por um combustível específico, mostra ele
        if (searchQuery && current.fuel_type.toLowerCase().includes(searchQuery.toLowerCase())) return current;
        // Senão, mostra o mais barato geral
        return Number(current.price) < Number(min.price) ? current : min;
      }, null);
      
      return { ...station, displayPriceObj };
    })
    .filter(station => station.displayPriceObj);

  processedStations.sort((a, b) => {
    if (activeSort === "price") {
      return Number(a.displayPriceObj.price) - Number(b.displayPriceObj.price);
    } else {
      return Number(b.rating) - Number(a.rating);
    }
  });

  const handleNavigate = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const encodedAddress = encodeURIComponent(address);
    window.open(`http://googleusercontent.com/maps.google.com/3{encodedAddress}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-24 relative">
      
      {/* CABEÇALHO PREMIUM */}
      <div className="bg-primary px-4 pt-12 pb-6 sticky top-0 z-30 shadow-md rounded-b-[30px]">
        <h1 className="font-display text-2xl font-bold text-primary-foreground mb-5 flex items-center gap-2">
          <Compass size={24} className="opacity-80" /> Explorar
        </h1>
        
        <div className="relative flex items-center shadow-lg rounded-2xl">
          <Search size={20} className="absolute left-4 text-muted-foreground z-10" />
          <input 
            type="text" 
            placeholder="Nome, bandeira, combustível..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch(searchQuery)}
            className="w-full bg-background border-none rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-white/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1.5 text-muted-foreground hover:text-foreground bg-muted rounded-full active:scale-95 transition-transform z-10"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros de Ordenação Animados */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 16 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="flex gap-2 overflow-hidden">
              <button
                onClick={() => setActiveSort("price")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${activeSort === "price" ? "bg-white text-primary" : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"}`}
              >
                <TrendingDown size={14} /> Menor Preço
              </button>
              <button
                onClick={() => setActiveSort("rating")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${activeSort === "rating" ? "bg-white text-yellow-600" : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"}`}
              >
                <Star size={14} className={activeSort === "rating" ? "fill-yellow-500 text-yellow-500" : ""} /> Melhor Avaliação
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-6">
        
        {/* ESTADO 1: TELA EXPLORAR (Sem busca ativa) */}
        {!searchQuery ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            
            {/* Grid de Categorias (Espetacular) */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Busca Rápida
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    onClick={() => handleSaveSearch(cat.label)}
                    className={`p-4 rounded-2xl border ${cat.bg} ${cat.border} cursor-pointer active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 shadow-sm`}
                  >
                    <div className="p-3 bg-background rounded-full shadow-sm">
                      {cat.icon}
                    </div>
                    <span className={`font-bold text-sm ${cat.text}`}>{cat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Histórico Corrigido */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <History size={16} className="text-muted-foreground" /> Buscas Recentes
                  </h3>
                  <button onClick={() => { setRecentSearches([]); localStorage.removeItem("fuelrank_recent_searches"); }} className="text-[10px] font-bold text-muted-foreground uppercase hover:text-primary transition-colors">
                    Limpar
                  </button>
                </div>
                
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <AnimatePresence>
                    {recentSearches.map((query, index) => (
                      <motion.div 
                        key={query}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        onClick={() => handleSaveSearch(query)}
                        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted ${index !== recentSearches.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                          <Search size={16} className="text-muted-foreground" /> {query}
                        </div>
                        {/* Botão X Perfeito */}
                        <button 
                          onClick={(e) => removeRecentSearch(e, query)} 
                          className="p-1.5 bg-muted rounded-full text-muted-foreground hover:bg-destructive hover:text-white transition-all active:scale-90"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        ) : 
        
        /* ESTADO 2: RESULTADOS DA BUSCA */
        isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : processedStations.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground mb-2 px-1">
              {processedStations.length} {processedStations.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
            {processedStations.map((station, index) => (
              <motion.div 
                key={station.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSaveSearch(searchQuery) || navigate(`/station/${station.id}`)}
                className="bg-background rounded-2xl p-4 shadow-sm border-2 border-border/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden hover:border-primary/50"
              >
                <div className="flex justify-between items-start mb-2 pr-12">
                  <h3 className="font-display font-bold text-foreground text-base truncate">{station.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg">
                    <Star size={12} className="fill-yellow-600" />
                    <span>{Number(station.rating).toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 font-medium">
                  <MapPin size={12} className="text-primary/70 shrink-0" />
                  <span className="truncate">{station.address}</span>
                </div>

                <div className="bg-secondary/50 rounded-xl p-3 flex justify-between items-center border border-border">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 flex items-center gap-1">
                      <Fuel size={12}/> {station.displayPriceObj.fuel_type.replace('_', ' ')}
                    </p>
                    <div className="flex items-start gap-1">
                      <span className="text-sm font-bold text-foreground mt-1">R$</span>
                      <span className="font-display text-3xl font-bold tracking-tighter text-foreground leading-none">
                        {Number(station.displayPriceObj.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => handleNavigate(e, station.address)}
                    className="w-12 h-12 bg-foreground text-background rounded-xl flex items-center justify-center hover:bg-foreground/90 transition-transform active:scale-90 shadow-md"
                  >
                    <Navigation size={20} className="fill-background" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 px-6 bg-background rounded-3xl border-2 border-dashed border-border mt-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
              <Compass size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">Nenhum posto encontrado</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Não encontramos resultados para "{searchQuery}". Tente buscar por bairro ou por outro combustível.</p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPage;