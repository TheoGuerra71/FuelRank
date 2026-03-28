/**
 * Envio de avaliação positiva ou denúncia — integrado à API Node (sem Supabase).
 *
 * Política de prova (`proofUrl`):
 * - A MVP local ainda não envia arquivo para S3. Se o usuário anexar foto, geramos uma URL “pendente”
 *   baseada no nome do arquivo; caso contrário usamos um placeholder explícito.
 *   Quando o storage existir, substitua só esta função por upload + URL definitiva.
 */

import { apiRequest } from '@/lib/api';
import type { FuelType } from '@/types/app';
import { AlertTriangle, ArrowLeft, Camera, ThumbsUp, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

type StationLookupPayload = { station: { name: string } | null };

function buildProofUrl(file: File | null): string {
  if (file?.name) {
    return `https://cdn.fuelrank.local/pending-upload/${encodeURIComponent(file.name.replace(/[/\\]/g, '_'))}`;
  }
  return 'https://cdn.fuelrank.local/placeholder/sem-comprovante.jpg';
}

const EvaluateStation = () => {
  const { id: stationId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stationName, setStationName] = useState('Carregando posto...');
  const [expType, setExpType] = useState<'review' | 'complaint' | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('gnv');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const payload = await apiRequest<StationLookupPayload>(`stations/${stationId}`);
        setStationName(payload.station?.name ?? 'Posto');
      } catch {
        setStationName('Posto');
      }
    })();
  }, [stationId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setProofFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expType || !stationId) {
      toast.error('Selecione o tipo de registro.');
      return;
    }

    const proofUrl = buildProofUrl(proofFile);

    setIsSubmitting(true);
    try {
      if (expType === 'review') {
        await apiRequest('evaluations/review', {
          method: 'POST',
          body: {
            stationId,
            rating,
            comment: comment.trim() || 'Sem comentário.',
            proofUrl,
          },
        });
      } else {
        await apiRequest('evaluations/complaint', {
          method: 'POST',
          body: {
            stationId,
            fuelType,
            description: description.trim(),
            proofUrl,
            ...(date ? { refuelingDate: `${date}T12:00:00.000Z` } : {}),
          },
        });
      }
      toast.success('Registro enviado com sucesso. Obrigado por colaborar!');
      navigate(-1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border px-4 pt-12 pb-5">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 p-1">
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
        <p className="text-sm font-semibold text-foreground mb-3">Como foi sua experiência?</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setExpType('review')}
            className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 ${expType === 'review' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground'}`}
          >
            <ThumbsUp size={28} />
            <span className="font-bold text-sm">Tudo Certo</span>
          </button>
          <button
            type="button"
            onClick={() => setExpType('complaint')}
            className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 ${expType === 'complaint' ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-card border-border text-muted-foreground'}`}
          >
            <AlertTriangle size={28} />
            <span className="font-bold text-sm">Houve Fraude / Erro</span>
          </button>
        </div>
        {expType === 'review' && (
          <div className="space-y-5 mb-6">
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full bg-card border border-border rounded-lg p-3"
              required
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-card border border-border rounded-lg p-3 h-24"
              placeholder="Conte como foi o atendimento e o preço..."
              required
            />
          </div>
        )}
        {expType === 'complaint' && (
          <div className="space-y-5 mb-6">
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="w-full bg-card border border-border rounded-lg p-3"
            >
              <option value="gnv">GNV</option>
              <option value="gasolina_comum">Gasolina Comum</option>
              <option value="gasolina_aditivada">Gasolina Aditivada</option>
              <option value="etanol">Etanol</option>
              <option value="diesel">Diesel</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-card border border-border rounded-lg p-3"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-card border border-border rounded-lg p-3 h-24"
              placeholder="Descreva o ocorrido com o máximo de detalhes."
              required
            />
          </div>
        )}
        {expType && (
          <div className="space-y-2 mb-6">
            <label className="text-sm font-semibold text-foreground">Foto do comprovante (opcional por enquanto)</label>
            <p className="text-xs text-muted-foreground">
              Se não houver upload, enviamos uma URL de espaço reservado até o bucket S3 estar pronto.
            </p>
            <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-card overflow-hidden min-h-[140px]">
              {previewUrl ? (
                <img src={previewUrl} alt="Pré-visualização" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              ) : (
                <div className="bg-primary/10 p-3 rounded-full text-primary z-10">
                  <Upload size={24} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            </div>
          </div>
        )}
        <button type="submit" disabled={isSubmitting || !expType} className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl">
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

export default EvaluateStation;
