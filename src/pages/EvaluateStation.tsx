import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowLeft, Camera, Send, ThumbsUp, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 🕵️‍♂️ Tela de Avaliação e Denúncia: O "Reclame Aqui" do FuelRank.
// Aqui o usuário pode tanto elogiar um posto quanto reportar uma fraude com foto de comprovante.
const EvaluateStation = () => {
  // 🔗 Pega o ID do posto que está na URL (ex: /evaluate/123 -> id = "123")
  const { id } = useParams();
  
  // 🧭 O nosso "motorista" para voltar de tela depois que enviar a denúncia
  const navigate = useNavigate();
  
  // 🔒 Trava do botão de envio (evita criar 5 denúncias iguais se a internet estiver lenta)
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Nome do posto que aparece no topo da tela
  const [stationName, setStationName] = useState("Carregando posto...");

  // ==========================================
  // ESTADOS PRINCIPAIS DO FORMULÁRIO
  // ==========================================

  // 🚦 Escolha de Fluxo: O que o usuário quer fazer? 
  // 'review' = Elogio / 'complaint' = Denúncia de Fraude
  const [expType, setExpType] = useState<"review" | "complaint" | null>(null);

  // 📸 Campos de Arquivo (A "prova do crime")
  const [proofFile, setProofFile] = useState<File | null>(null); // O arquivo bruto (peso, dados)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // O link gerado pro navegador mostrar a prévia na tela

  // ⭐ Campos caso seja "Avaliação Positiva" ('review')
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // 🚨 Campos caso seja "Denúncia" ('complaint')
  const [fuelType, setFuelType] = useState("gnv");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  // ==========================================
  // EFEITOS E FUNÇÕES AUXILIARES
  // ==========================================

  // 🔍 Busca o nome do posto assim que a tela abre, para não ficar "Posto: Desconhecido"
  useEffect(() => {
    const fetchStation = async () => {
      // Vai na tabela stations, pega só a coluna 'name' onde o ID seja o ID da URL
      const { data } = await supabase.from("stations").select("name").eq("id", id!).single();
      if (data) setStationName(data.name);
    };
    if (id) fetchStation();
  }, [id]);

  // 🖼️ Função chamada quando o usuário escolhe uma foto na galeria ou tira uma foto na hora
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Se ele selecionou algum arquivo...
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file); // Salva o arquivo real para enviarmos depois
      setPreviewUrl(URL.createObjectURL(file)); // Cria um link "falso" só para mostrar a prévia da foto na tela dele
    }
  };

  // ==========================================
  // O GRANDE MOMENTO: ENVIO COM UPLOAD DE IMAGEM
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações de segurança antes de gastar internet do usuário
    if (!expType) return alert("Por favor, selecione como foi sua experiência.");
    if (!proofFile) return alert("Por favor, anexe a foto do comprovante ou da bomba.");
    
    setIsSubmitting(true);

    try {
      // Descobre quem é o usuário logado que está enviando isso
      const { data: authData } = await supabase.auth.getUser();

      // --- PASSO 1: UPLOAD DA FOTO PARA O SUPABASE STORAGE (A Nuvem) ---
      // Pra evitar que duas pessoas enviem "foto.jpg" e uma apague a da outra, geramos um nome aleatório
      const fileExt = proofFile.name.split('.').pop(); // Descobre se é .jpg, .png, etc
      const fileName = `${Math.random()}.${fileExt}`; // Ex: 0.1837482.jpg
      const filePath = `${fileName}`;

      // Envia o arquivo físico para a "pasta" (bucket) chamada 'proofs'
      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, proofFile);

      if (uploadError) {
        console.error("Erro no upload da foto:", uploadError);
        throw new Error("Falha ao enviar a imagem. Verifique as permissões do Storage.");
      }

      // Agora que a foto subiu, precisamos pedir o "Link Público" dela pra salvar no Banco de Dados
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      // --- PASSO 2: SALVAR OS TEXTOS NO BANCO DE DADOS (Junto com o link da foto) ---
      
      if (expType === "review") {
        // FLUXO DE AVALIAÇÃO POSITIVA
        const { error } = await supabase.from("reviews").insert({
          station_id: id,
          user_id: authData.user?.id,
          rating: rating,
          comment: comment,
          proof_url: publicUrl, // Salva o link da foto recém-enviada!
          is_verified: false
        });
        if (error) throw error;
        alert("Avaliação enviada com sucesso!");

      } else if (expType === "complaint") {
        // FLUXO DE DENÚNCIA (Vai para a Caixa de Entrada do AdminPanel)
        const { error } = await supabase.from("complaints").insert({
          station_id: id,
          reported_by: authData.user?.id,
          fuel_type: fuelType,
          refueling_date: date,
          description: description,
          proof_url: publicUrl, // Salva o link da prova do crime!
          status: "pending" // Importante: Nasce como "Pendente" para o dono do app revisar.
        });
        if (error) throw error;
        alert("Denúncia com foto registrada! Ela já está no Painel Administrativo.");
      }

      // Deu tudo certo! Volta o cara para a tela do posto.
      navigate(-1); 

    } catch (error) {
      console.error(error);
      alert("Erro ao enviar os dados. Tente novamente.");
    } finally {
      setIsSubmitting(false); // Libera o botão
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DA TELA (O Visual)
  // ==========================================
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 🎩 Cabeçalho Fixo */}
      <div className="bg-card border-b border-border px-4 pt-12 pb-5">
        <button onClick={() => navigate(-1)} className="mb-4 p-1">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Camera className="text-primary" size={24} />
          <h1 className="font-display text-xl font-bold text-foreground">Avaliar Experiência</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Posto: <strong className="text-foreground">{stationName}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6">
        
        {/* 🔀 ESCOLHA DE FLUXO (O usuário escolhe se quer Elogiar ou Denunciar) */}
        <p className="text-sm font-semibold text-foreground mb-3">Como foi sua experiência?</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Botão de Elogio */}
          <button
            type="button"
            onClick={() => setExpType("review")}
            className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${expType === "review" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}
          >
            <ThumbsUp size={28} />
            <span className="font-bold text-sm">Tudo Certo</span>
          </button>
          
          {/* Botão de Denúncia (Fica vermelho se clicado) */}
          <button
            type="button"
            onClick={() => setExpType("complaint")}
            className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${expType === "complaint" ? "bg-destructive/10 border-destructive text-destructive" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}
          >
            <AlertTriangle size={28} />
            <span className="font-bold text-sm">Houve Fraude / Erro</span>
          </button>
        </div>

        {/* 📝 FORMULÁRIO 1: Aparece SÓ se escolheu "Tudo Certo" */}
        {expType === "review" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Sua Nota (1 a 5 estrelas)</label>
              <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full bg-card border border-border rounded-lg p-3 text-foreground" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Elogio ou Comentário</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="O atendimento foi rápido? Preço justo?" className="w-full bg-card border border-border rounded-lg p-3 text-foreground h-24 resize-none" required />
            </div>
          </div>
        )}

        {/* 🚨 FORMULÁRIO 2: Aparece SÓ se escolheu "Houve Fraude" */}
        {expType === "complaint" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Qual foi o combustível?</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="w-full bg-card border border-border rounded-lg p-3 text-foreground" required>
                <option value="gnv">GNV</option>
                <option value="gasolina_comum">Gasolina Comum</option>
                <option value="gasolina_aditivada">Gasolina Aditivada</option>
                <option value="etanol">Etanol</option>
                <option value="diesel">Diesel</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Data do ocorrido</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-card border border-border rounded-lg p-3 text-foreground" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Descreva a fraude</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Cilindro é de 18m³ mas a bomba injetou 20,56m³..." className="w-full bg-card border border-border rounded-lg p-3 text-foreground h-24 resize-none" required />
            </div>
          </div>
        )}

        {/* 📷 ÁREA DE ANEXAR FOTO (Aparece para ambos os fluxos, por isso é && expType) */}
        {expType && (
          <div className="space-y-2 mb-6 animate-in fade-in">
            <label className="text-sm font-semibold text-foreground">Foto do Comprovante (Obrigatório)</label>
            <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-card overflow-hidden transition-colors hover:border-primary">
              
              {/* Se ele já selecionou a foto, mostra a prévia borrada ao fundo! */}
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Pré-visualização" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="relative z-10 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border text-sm font-bold shadow-sm">
                    Trocar foto
                  </div>
                </>
              ) : (
                // Se não selecionou nada ainda, mostra o ícone de Upload
                <>
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Upload size={24} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground text-center">
                    Toque para tirar foto ou <br/> escolher da galeria
                  </span>
                </>
              )}
              
              {/* 🕵️‍♂️ O Input real que abre a câmera/galeria fica INVISÍVEL por cima de toda essa caixa decorada! */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                required 
              />
            </div>
          </div>
        )}

        {/* 🚀 BOTÃO DE ENVIAR (Só aparece depois que escolhe uma das opções) */}
        {expType && (
          <button type="submit" disabled={isSubmitting} className="w-full bg-foreground text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]">
            {isSubmitting ? "Enviando com comprovante..." : <><Send size={18} /> Enviar Avaliação</>}
          </button>
        )}
      </form>
    </div>
  );
};

export default EvaluateStation;