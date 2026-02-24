import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Fuel, MapPin, PlusCircle, Store, Tag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Lista de combustíveis disponíveis para seleção
const FUEL_OPTIONS = [
  { id: "gnv", label: "GNV (m³)" },
  { id: "gasolina_comum", label: "Gasolina Comum" },
  { id: "gasolina_aditivada", label: "Gasolina Aditivada" },
  { id: "etanol", label: "Etanol" },
  { id: "diesel", label: "Diesel" },
];

const AddStation = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Informações Básicas
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [address, setAddress] = useState("");

  // Promoção
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promotionText, setPromotionText] = useState("");

  // Estado para guardar quais combustíveis foram selecionados e seus preços
  // Exemplo de como fica por baixo dos panos: { gnv: { selected: true, price: "4.59" } }
  const [fuelData, setFuelData] = useState<Record<string, { selected: boolean; price: string }>>(
    FUEL_OPTIONS.reduce((acc, fuel) => ({ ...acc, [fuel.id]: { selected: false, price: "" } }), {})
  );

  // Função para lidar com o clique na caixinha do combustível
  const toggleFuel = (fuelId: string) => {
    setFuelData((prev) => ({
      ...prev,
      [fuelId]: { ...prev[fuelId], selected: !prev[fuelId].selected },
    }));
  };

  // Função para atualizar o preço digitado
  const handlePriceChange = (fuelId: string, value: string) => {
    setFuelData((prev) => ({
      ...prev,
      [fuelId]: { ...prev[fuelId], price: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Verifica se pelo menos um combustível foi selecionado com preço
    const selectedFuels = Object.entries(fuelData).filter(([_, data]) => data.selected && data.price);
    
    if (selectedFuels.length === 0) {
      alert("Por favor, selecione pelo menos um combustível e informe o preço médio.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. PRIMEIRO PASSO: Salva o posto na tabela 'stations'
      const { data: newStation, error: stationError } = await supabase
        .from("stations")
        .insert({
          name: name,
          brand: brand,
          address: address,
          has_promotion: hasPromotion,
          promotion_text: hasPromotion ? promotionText : null,
          seal: "observation", // Todo posto novo começa "Em Observação"
          rating: 0,
          review_count: 0,
          complaints_count: 0
        })
        .select()
        .single(); // Pega os dados do posto que acabou de ser criado (precisamos do ID dele)

      if (stationError) throw stationError;

      // 2. SEGUNDO PASSO: Pega o ID do posto novo e salva os preços na tabela 'fuel_prices'
      const pricesToInsert = selectedFuels.map(([fuelId, data]) => ({
        station_id: newStation.id,
        fuel_type: fuelId,
        price: parseFloat(data.price.replace(",", ".")), // Garante que o número vá no formato certo pro banco
      }));

      const { error: pricesError } = await supabase
        .from("fuel_prices")
        .insert(pricesToInsert);

      if (pricesError) throw pricesError;

      alert("Posto cadastrado com sucesso!");
      navigate(`/station/${newStation.id}`); // Redireciona o usuário direto para a tela do posto recém-criado!

    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar o posto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cabeçalho */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">Cadastrar Novo Posto</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-9">
          Ajude a comunidade adicionando um posto confiável.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-8">
        
        {/* Bloco 1: Informações Básicas */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Store size={16} className="text-primary"/> 1. Dados Básicos
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nome do Posto</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Auto Posto Merck" className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Bandeira</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Ipiranga, Shell, BR, Sem Bandeira" className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Endereço Completo</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Número, Bairro" className="w-full bg-background border border-border rounded-lg p-3 pl-10 text-sm focus:outline-none focus:border-primary transition-colors" required />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Combustíveis e Preços */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Fuel size={16} className="text-primary"/> 2. Combustíveis e Preços
          </h2>
          <div className="bg-card border border-border rounded-xl p-2 shadow-sm divide-y divide-border">
            {FUEL_OPTIONS.map((fuel) => (
              <div key={fuel.id} className="p-3 flex items-center justify-between gap-4 transition-colors hover:bg-muted/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input 
                    type="checkbox" 
                    checked={fuelData[fuel.id].selected} 
                    onChange={() => toggleFuel(fuel.id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className={`text-sm font-medium ${fuelData[fuel.id].selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {fuel.label}
                  </span>
                </label>
                
                {/* O campo de preço SÓ aparece se o combustível estiver marcado! */}
                {fuelData[fuel.id].selected && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <span className="text-sm text-muted-foreground font-medium">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelData[fuel.id].price}
                      onChange={(e) => handlePriceChange(fuel.id, e.target.value)}
                      placeholder="0,00"
                      className="w-24 bg-background border border-primary/30 rounded-lg p-2 text-sm font-bold text-center focus:outline-none focus:border-primary shadow-[0_0_0_2px_rgba(var(--primary),0.1)]"
                      required={fuelData[fuel.id].selected} // Se marcou, é obrigatório dar o preço!
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 3: Promoções */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Tag size={16} className="text-primary"/> 3. Promoções (Opcional)
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={hasPromotion} onChange={(e) => setHasPromotion(e.target.checked)} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm font-medium text-foreground">Posto com promoção ativa?</span>
            </label>
            
            {hasPromotion && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <textarea 
                  value={promotionText} 
                  onChange={(e) => setPromotionText(e.target.value)} 
                  placeholder="Ex: Abasteça GNV e ganhe lavagem ducha grátis!" 
                  className="w-full bg-background border border-primary/50 rounded-lg p-3 text-sm focus:outline-none focus:border-primary resize-none h-20"
                  required={hasPromotion}
                />
              </div>
            )}
          </div>
        </div>

        {/* Botão de Enviar */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-foreground text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] mt-8 shadow-lg disabled:opacity-70"
        >
          {isSubmitting ? "Salvando posto..." : (
            <>
              <PlusCircle size={20} />
              Concluir Cadastro
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddStation;