import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Fuel, MapPin, PlusCircle, Store, Tag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 📝 Theo, essa é a nossa "Fonte da Verdade" para os combustíveis.
// Se no futuro precisarmos adicionar "Eletricidade" ou "GNV 3ª Geração", 
// é só colocar nessa lista e o aplicativo inteiro se atualiza sozinho.
const FUEL_OPTIONS = [
  { id: "gnv", label: "GNV (m³)" },
  { id: "gasolina_comum", label: "Gasolina Comum" },
  { id: "gasolina_aditivada", label: "Gasolina Aditivada" },
  { id: "etanol", label: "Etanol" },
  { id: "diesel", label: "Diesel" },
];

const AddStation = () => {
  // 🧭 useNavigate é o nosso "motorista". Usamos para jogar o usuário pra outra tela.
  const navigate = useNavigate();
  
  // 🔒 Trava de segurança: impede que o usuário clique 2x no botão e crie o posto duplicado.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // ESTADOS DO FORMULÁRIO (O que o usuário digita)
  // ==========================================
  
  // 1. Informações Básicas
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [address, setAddress] = useState("");

  // 2. Promoção (A sacada para engajar os postos)
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promotionText, setPromotionText] = useState("");

  // 3. O Cérebro dos Preços (Presta atenção aqui, Theo do Futuro!)
  // Em vez de criar 10 variáveis soltas (ex: temGnv, precoGnv, temGasolina, precoGasolina...),
  // nós usamos um único Objeto Inteligente. 
  // O 'reduce' abaixo pega o FUEL_OPTIONS e transforma nisso:
  // { gnv: { selected: false, price: "" }, gasolina_comum: { selected: false, price: "" }, ... }
  const [fuelData, setFuelData] = useState<Record<string, { selected: boolean; price: string }>>(
    FUEL_OPTIONS.reduce((acc, fuel) => ({ ...acc, [fuel.id]: { selected: false, price: "" } }), {})
  );

  // ==========================================
  // FUNÇÕES DE MANIPULAÇÃO (Handlers)
  // ==========================================

  // 🔄 Função que liga/desliga a caixinha (checkbox) de um combustível específico.
  const toggleFuel = (fuelId: string) => {
    setFuelData((prev) => ({
      ...prev, // Mantém os outros combustíveis intactos
      [fuelId]: { 
        ...prev[fuelId], 
        selected: !prev[fuelId].selected // Inverte apenas o 'selected' do combustível clicado
      },
    }));
  };

  // 💰 Função que atualiza o valor financeiro digitado no input de preço.
  const handlePriceChange = (fuelId: string, value: string) => {
    setFuelData((prev) => ({
      ...prev,
      [fuelId]: { ...prev[fuelId], price: value }, // Substitui o preço antigo pelo que o usuário acabou de digitar
    }));
  };

  // ==========================================
  // O GRANDE MOMENTO: ENVIO PARA O BANCO (SUPABASE)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de recarregar (comportamento padrão de formulários web)
    setIsSubmitting(true); // Ativa o "Loading..." no botão

    // 🛑 Filtro de Inteligência: Separa apenas os combustíveis que o usuário MARCOU e COLOCOU PREÇO.
    const selectedFuels = Object.entries(fuelData).filter(([_, data]) => data.selected && data.price);
    
    // Validação de segurança: Não faz sentido criar um posto sem saber o preço de nada, né?
    if (selectedFuels.length === 0) {
      alert("Por favor, selecione pelo menos um combustível e informe o preço médio.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 🚀 TRANSAÇÃO PASSO 1: Salvar a "Casca" do Posto na tabela 'stations'
      const { data: newStation, error: stationError } = await supabase
        .from("stations")
        .insert({
          name: name,
          brand: brand,
          address: address,
          has_promotion: hasPromotion,
          promotion_text: hasPromotion ? promotionText : null, // Só envia texto se tiver promoção ativa
          seal: "observation", // Regra de Negócio: Todo posto novo nasce "Em Observação" até a comunidade validar.
          rating: 0,
          review_count: 0,
          complaints_count: 0
        })
        .select() // Pulo do gato: Exige que o banco devolva a linha criada...
        .single(); // ... para podermos pegar o 'newStation.id' gerado lá no servidor!

      if (stationError) throw stationError;

      // 🚀 TRANSAÇÃO PASSO 2: Salvar os Preços na tabela 'fuel_prices'
      // Aqui nós pegamos aquele array de combustíveis filtrados e mapeamos para o formato que o Banco de Dados exige.
      const pricesToInsert = selectedFuels.map(([fuelId, data]) => ({
        station_id: newStation.id, // O ID fresquinho que o Passo 1 acabou de nos dar!
        fuel_type: fuelId,
        // Tratamento de Dados: O brasileiro digita "4,59" (vírgula), mas o Banco de Dados (SQL) só entende "4.59" (ponto).
        price: parseFloat(data.price.replace(",", ".")), 
      }));

      // Faz o insert em massa (envia todos os preços de uma vez só, poupando requisições!)
      const { error: pricesError } = await supabase
        .from("fuel_prices")
        .insert(pricesToInsert);

      if (pricesError) throw pricesError;

      // 🎉 Sucesso absoluto! 
      alert("Posto cadastrado com sucesso!");
      navigate(`/station/${newStation.id}`); // Redireciona o usuário para a página de detalhes do posto recém-criado.

    } catch (error) {
      console.error("Erro Crítico no Cadastro:", error); // Salva no console (F12) para podermos debugar se der ruim.
      alert("Erro ao cadastrar o posto. Tente novamente.");
    } finally {
      // Dando certo ou errado, libera o botão para ser clicado novamente.
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DA TELA (O visual)
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 🎩 Cabeçalho Fixo (Sticky) - Fica sempre no topo enquanto rola a página */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* navigate(-1) faz o app voltar para a tela anterior exata que o usuário estava */}
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
        
        {/* 🏢 Bloco 1: Informações Básicas (Onde fica, Qual o nome) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Store size={16} className="text-primary"/> 1. Dados Básicos
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
            {/* Input: Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nome do Posto</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Auto Posto Merck" className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors" required />
            </div>
            {/* Input: Bandeira */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Bandeira</label>
              <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Ipiranga, Shell, BR, Sem Bandeira" className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary transition-colors" required />
            </div>
            {/* Input: Endereço (com ícone absoluto dentro do input) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Endereço Completo</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Número, Bairro" className="w-full bg-background border border-border rounded-lg p-3 pl-10 text-sm focus:outline-none focus:border-primary transition-colors" required />
              </div>
            </div>
          </div>
        </div>

        {/* ⛽ Bloco 2: Combustíveis e Preços (A parte Dinâmica) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Fuel size={16} className="text-primary"/> 2. Combustíveis e Preços
          </h2>
          <div className="bg-card border border-border rounded-xl p-2 shadow-sm divide-y divide-border">
            {/* Percorre a Fonte da Verdade (FUEL_OPTIONS) e cria uma linha para cada combustível */}
            {FUEL_OPTIONS.map((fuel) => (
              <div key={fuel.id} className="p-3 flex items-center justify-between gap-4 transition-colors hover:bg-muted/50 rounded-lg">
                
                {/* Lado Esquerdo: Checkbox + Nome do Combustível */}
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input 
                    type="checkbox" 
                    checked={fuelData[fuel.id].selected} 
                    onChange={() => toggleFuel(fuel.id)}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  {/* Se estiver selecionado, a letra fica escura. Se não, fica cinza clarinho. */}
                  <span className={`text-sm font-medium ${fuelData[fuel.id].selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {fuel.label}
                  </span>
                </label>
                
                {/* Lado Direito: Input de Preço. 
                    MÁGICA: O && faz o input SÓ APARECER na tela se a caixinha estiver marcada! */}
                {fuelData[fuel.id].selected && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <span className="text-sm text-muted-foreground font-medium">R$</span>
                    <input
                      type="number"
                      step="0.01" // Permite digitar centavos
                      min="0"
                      value={fuelData[fuel.id].price}
                      onChange={(e) => handlePriceChange(fuel.id, e.target.value)}
                      placeholder="0,00"
                      className="w-24 bg-background border border-primary/30 rounded-lg p-2 text-sm font-bold text-center focus:outline-none focus:border-primary shadow-[0_0_0_2px_rgba(var(--primary),0.1)]"
                      required={fuelData[fuel.id].selected} // Se o cara marcou que tem, o navegador exige que ele digite o preço!
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 📢 Bloco 3: Promoções */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Tag size={16} className="text-primary"/> 3. Promoções (Opcional)
          </h2>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={hasPromotion} onChange={(e) => setHasPromotion(e.target.checked)} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm font-medium text-foreground">Posto com promoção ativa?</span>
            </label>
            
            {/* Se marcou que tem promoção, abre a caixa de texto com animação suave */}
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

        {/* 🚀 Botão de Enviar Formulário */}
        <button 
          type="submit" 
          disabled={isSubmitting} // Desativa o botão se já estiver enviando (evita duplo clique)
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