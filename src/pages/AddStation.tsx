import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from '@/contexts/TenantContext';
import { apiRequest } from '@/lib/api';
import type { FuelType } from "@/types/app";
import { ArrowLeft, Fuel, MapPin, Store, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const FUEL_OPTIONS: { id: FuelType; label: string }[] = [
  { id: "gnv", label: "GNV (m³)" },
  { id: "gasolina_comum", label: "Gasolina Comum" },
  { id: "gasolina_aditivada", label: "Gasolina Aditivada" },
  { id: "etanol", label: "Etanol" },
  { id: "diesel", label: "Diesel" },
];

const AddStation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promotionText, setPromotionText] = useState("");
  const [fuelData, setFuelData] = useState<Record<FuelType, { selected: boolean; price: string }>>({ gnv: { selected: false, price: '' }, gasolina_comum: { selected: false, price: '' }, gasolina_aditivada: { selected: false, price: '' }, etanol: { selected: false, price: '' }, diesel: { selected: false, price: '' } });
  const selectedFuels = useMemo(() => Object.entries(fuelData).filter(([, data]) => data.selected && data.price), [fuelData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/auth');
    if (!activeTenant) return alert('Nenhum tenant ativo selecionado para o cadastro.');
    if (selectedFuels.length === 0) return alert('Selecione pelo menos um combustível.');
    const lat = Number(latitude.replace(',', '.'));
    const lng = Number(longitude.replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return alert('Informe latitude e longitude válidas.');

    setIsSubmitting(true);
    try {
      // Comentário importante: agora o frontend não conversa mais com Supabase direto.
      // Toda gravação vai para a API REST, que por sua vez pode usar PostgreSQL puro no backend.
      const station = await apiRequest<{ id: string }>('stations', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: activeTenant.id,
          name,
          brand,
          address,
          lat,
          lng,
          has_promotion: hasPromotion,
          promotion_text: hasPromotion ? promotionText : null,
          prices: selectedFuels.map(([fuelId, data]) => ({ fuel_type: fuelId as FuelType, price: Number(data.price.replace(',', '.')) })),
        }),
      });
      alert('Posto cadastrado com sucesso!');
      navigate(`/station/${station.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao cadastrar o posto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFuel = (fuelId: FuelType) => setFuelData((prev) => ({ ...prev, [fuelId]: { ...prev[fuelId], selected: !prev[fuelId].selected } }));
  const handlePriceChange = (fuelId: FuelType, value: string) => setFuelData((prev) => ({ ...prev, [fuelId]: { ...prev[fuelId], price: value } }));

  return <div className="min-h-screen bg-background pb-24"><div className="bg-card border-b border-border px-4 pt-12 pb-5 sticky top-0 z-10"><div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft size={22} className="text-foreground" /></button><h1 className="font-display text-xl font-bold text-foreground">Cadastrar Novo Posto</h1></div><p className="text-sm text-muted-foreground mt-1 ml-9">Tenant atual: {activeTenant?.name ?? 'Sem tenant'}.</p></div><form onSubmit={handleSubmit} className="px-4 py-6 space-y-8"><div className="space-y-4"><h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider"><Store size={16} className="text-primary" /> 1. Dados Básicos</h2><div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Posto" className="w-full bg-background border border-border rounded-lg p-3 text-sm" required /><input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Bandeira" className="w-full bg-background border border-border rounded-lg p-3 text-sm" required /><div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço" className="w-full bg-background border border-border rounded-lg p-3 pl-10 text-sm" required /></div><div className="grid grid-cols-2 gap-3"><input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" className="w-full bg-background border border-border rounded-lg p-3 text-sm" required /><input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" className="w-full bg-background border border-border rounded-lg p-3 text-sm" required /></div></div></div><div className="space-y-4"><h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider"><Fuel size={16} className="text-primary" /> 2. Combustíveis e Preços</h2><div className="bg-card border border-border rounded-xl p-2 shadow-sm divide-y divide-border">{FUEL_OPTIONS.map((fuel) => <div key={fuel.id} className="p-3 flex items-center justify-between gap-4"><label className="flex items-center gap-3 cursor-pointer flex-1"><input type="checkbox" checked={fuelData[fuel.id].selected} onChange={() => toggleFuel(fuel.id)} /><span>{fuel.label}</span></label>{fuelData[fuel.id].selected && <input type="number" step="0.01" min="0" value={fuelData[fuel.id].price} onChange={(e) => handlePriceChange(fuel.id, e.target.value)} placeholder="0,00" className="w-24 bg-background border border-primary/30 rounded-lg p-2 text-sm font-bold text-center" required />}</div>)}</div></div><div className="space-y-4"><h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider"><Tag size={16} className="text-primary" /> 3. Promoções</h2><div className="bg-card border border-border rounded-xl p-4 shadow-sm"><label className="flex items-center gap-3 cursor-pointer mb-4"><input type="checkbox" checked={hasPromotion} onChange={(e) => setHasPromotion(e.target.checked)} /><span>Posto com promoção ativa?</span></label>{hasPromotion && <textarea value={promotionText} onChange={(e) => setPromotionText(e.target.value)} placeholder="Descreva a promoção" className="w-full bg-background border border-primary/50 rounded-lg p-3 text-sm h-20" required />}</div></div><button type="submit" disabled={isSubmitting} className="w-full bg-foreground text-background font-bold py-4 rounded-xl">{isSubmitting ? 'Salvando...' : 'Cadastrar posto'}</button></form></div>;
};

export default AddStation;
