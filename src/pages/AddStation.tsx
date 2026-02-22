import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddStation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("stations").insert([
      { name, brand, address, lat: -22.9, lng: -43.2 }
    ]);

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Posto cadastrado com sucesso!" });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2"/> Voltar</Button>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Posto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Nome do Posto" value={name} onChange={e => setName(e.target.value)} required />
        <Input placeholder="Bandeira (Ex: Ipiranga, Shell)" value={brand} onChange={e => setBrand(e.target.value)} />
        <Input placeholder="Endereço Completo" value={address} onChange={e => setAddress(e.target.value)} required />
        <Button type="submit" className="w-full bg-primary" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Posto"}
        </Button>
      </form>
    </div>
  );
}