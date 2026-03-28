import BottomNav from '@/components/BottomNav';
import { useTenant } from '@/contexts/TenantContext';
import { apiRequest } from '@/lib/api';
import {
  fetchAdminOverview,
  patchComplaintStatus,
  patchReviewModeration,
  patchStationApproval,
  patchStationFuelPricesAdmin,
  patchStationSeal,
  putReferenceFuelPrices,
  type NormalizedAdminOverview,
  type ReferencePriceItem,
} from '@/lib/adminApi';
import type { AdminModerationReview, AdminStationRow, ComplaintStatus, FuelType, ProfileRow, SealStatus } from '@/types/app';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Fuel,
  MapPin,
  MessageSquareWarning,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const FUEL_LABELS: Record<FuelType, string> = {
  gasolina_comum: 'Gasolina comum',
  gasolina_aditivada: 'Gasolina aditivada',
  etanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
};

const ALL_FUEL_TYPES = Object.keys(FUEL_LABELS) as FuelType[];

const COMPLAINT_STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_analysis', label: 'Em análise' },
  { value: 'approved', label: 'Aprovada (fraude)' },
  { value: 'resolved', label: 'Resolvida' },
  { value: 'archived', label: 'Arquivada' },
];

const SEAL_OPTIONS: { value: SealStatus; label: string }[] = [
  { value: 'trusted', label: 'Confiável' },
  { value: 'observation', label: 'Observação' },
  { value: 'complaints', label: 'Reclamações' },
];

type TabId = 'postos' | 'pendentes' | 'avaliacoes' | 'denuncias' | 'referencia';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { activeTenant } = useTenant();
  const [activeTab, setActiveTab] = useState<TabId>('postos');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<NormalizedAdminOverview | null>(null);
  const [expandedStationId, setExpandedStationId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [savingPricesId, setSavingPricesId] = useState<string | null>(null);
  const [refDraft, setRefDraft] = useState<Partial<Record<FuelType, string>>>({});
  const [savingRef, setSavingRef] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await fetchAdminOverview(activeTenant?.id);
      setData(payload);
      const ref = payload.referencePrices;
      const nextDraft: Partial<Record<FuelType, string>> = {};
      ALL_FUEL_TYPES.forEach((ft) => {
        const v = ref[ft];
        if (v != null && Number.isFinite(v)) nextDraft[ft] = String(v);
      });
      setRefDraft(nextDraft);
    } catch (error) {
      console.error('Erro ao buscar dados do painel:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o painel.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpdateSeal = async (stationId: string, newSeal: SealStatus) => {
    try {
      await patchStationSeal(stationId, newSeal);
      setData((current) =>
        current
          ? {
              ...current,
              stations: current.stations.map((s) => (s.id === stationId ? { ...s, seal: newSeal } : s)),
              pendingStations: current.pendingStations.map((s) => (s.id === stationId ? { ...s, seal: newSeal } : s)),
            }
          : current,
      );
      toast.success('Selo atualizado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao atualizar selo.');
    }
  };

  const handleApproval = async (stationId: string, status: 'approved' | 'rejected') => {
    try {
      await patchStationApproval(stationId, status);
      setData((current) =>
        current
          ? {
              ...current,
              pendingStations: current.pendingStations.filter((s) => s.id !== stationId),
              stations: current.stations.map((s) =>
                s.id === stationId ? { ...s, approval_status: status === 'approved' ? 'approved' : 'rejected' } : s,
              ),
            }
          : current,
      );
      toast.success(status === 'approved' ? 'Posto aprovado.' : 'Cadastro recusado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'A API precisa expor PATCH admin/stations/:id/approval.');
    }
  };

  const handleReviewModeration = async (reviewId: string, isVerified: boolean) => {
    try {
      await patchReviewModeration(reviewId, isVerified);
      setData((current) =>
        current
          ? { ...current, reviews: current.reviews.filter((r) => r.id !== reviewId) }
          : current,
      );
      toast.success(isVerified ? 'Comentário aprovado (verificado).' : 'Comentário reprovado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'A API precisa expor PATCH admin/reviews/:id.');
    }
  };

  const handleComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    try {
      await patchComplaintStatus(complaintId, status);
      setData((current) =>
        current
          ? {
              ...current,
              reports: current.reports.map((r) => (r.id === complaintId ? { ...r, status } : r)),
            }
          : current,
      );
      toast.success('Status da denúncia atualizado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'A API precisa expor PATCH admin/complaints/:id.');
    }
  };

  const handleSaveReferencePrices = async () => {
    if (!activeTenant?.id) {
      toast.error('Selecione um tenant no perfil.');
      return;
    }
    // Contrato HTTP: array `{ fuel_type, price }[]` — mais explícito para o Prisma fazer upsert por tipo.
    const prices: ReferencePriceItem[] = [];
    const merged: Partial<Record<FuelType, number>> = {};
    ALL_FUEL_TYPES.forEach((ft) => {
      const raw = refDraft[ft]?.replace(',', '.').trim();
      if (raw === '' || raw === undefined) return;
      const n = Number(raw);
      if (Number.isFinite(n)) {
        prices.push({ fuel_type: ft, price: n });
        merged[ft] = n;
      }
    });
    if (prices.length === 0) {
      toast.error('Preencha ao menos um combustível com valor válido.');
      return;
    }
    setSavingRef(true);
    try {
      await putReferenceFuelPrices(activeTenant.id, prices);
      toast.success('Preços de referência salvos.');
      setData((current) => (current ? { ...current, referencePrices: { ...current.referencePrices, ...merged } } : current));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar os preços de referência.');
    } finally {
      setSavingRef(false);
    }
  };

  const openPriceEditor = async (station: AdminStationRow) => {
    const id = station.id;
    if (expandedStationId === id) {
      setExpandedStationId(null);
      return;
    }
    setExpandedStationId(id);
    let rows = station.fuel_prices;
    if (!rows?.length) {
      try {
        const payload = await apiRequest<{ prices: { id: string; fuel_type: FuelType; price: number }[] }>(`stations/${id}`);
        rows = payload.prices?.map((p) => ({ id: p.id, fuel_type: p.fuel_type, price: p.price })) ?? [];
      } catch {
        rows = [];
      }
    }
    const draft: Record<string, string> = {};
    ALL_FUEL_TYPES.forEach((ft) => {
      const found = rows?.find((r) => r.fuel_type === ft);
      draft[ft] = found != null ? String(found.price) : '';
    });
    setPriceDraft(draft);
  };

  const handleSaveStationPrices = async (stationId: string) => {
    const items: { fuel_type: FuelType; price: number }[] = [];
    ALL_FUEL_TYPES.forEach((ft) => {
      const raw = priceDraft[ft]?.replace(',', '.').trim();
      if (raw === '' || raw === undefined) return;
      const n = Number(raw);
      if (Number.isFinite(n)) items.push({ fuel_type: ft, price: n });
    });
    if (items.length === 0) {
      toast.error('Informe ao menos um preço válido.');
      return;
    }
    setSavingPricesId(stationId);
    try {
      await patchStationFuelPricesAdmin(stationId, items);
      toast.success('Preços do posto atualizados.');
      setExpandedStationId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'A API precisa expor PATCH admin/stations/:id/prices.');
    } finally {
      setSavingPricesId(null);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const stations = data?.stations ?? [];
  const users = data?.users ?? [];
  const reports = data?.reports ?? [];
  const reviews = data?.reviews ?? [];
  const pendingStations = data?.pendingStations ?? [];

  const derivedPending = useMemo(() => {
    if (pendingStations.length > 0) return pendingStations;
    return stations.filter((s) => s.approval_status === 'pending');
  }, [pendingStations, stations]);

  const filteredStations = useMemo(
    () =>
      stations.filter(
        (station) =>
          !normalizedSearch ||
          station.name.toLowerCase().includes(normalizedSearch) ||
          station.address.toLowerCase().includes(normalizedSearch),
      ),
    [normalizedSearch, stations],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => !normalizedSearch || user.display_name.toLowerCase().includes(normalizedSearch)),
    [normalizedSearch, users],
  );

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          !normalizedSearch ||
          [report.description, report.stations?.name, report.profiles?.display_name]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch)),
      ),
    [normalizedSearch, reports],
  );

  const filteredReviews = useMemo(() => {
    const withComment = reviews.filter((r) => (r.comment ?? '').trim().length > 0);
    return withComment.filter(
      (r) =>
        !normalizedSearch ||
        (r.comment ?? '').toLowerCase().includes(normalizedSearch) ||
        (r.stations?.name ?? '').toLowerCase().includes(normalizedSearch) ||
        (r.profiles?.display_name ?? '').toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, reviews]);

  const complaintBadge = (status: ComplaintStatus) => {
    const map: Record<ComplaintStatus, string> = {
      pending: 'bg-amber-100 text-amber-800',
      in_analysis: 'bg-blue-100 text-blue-800',
      approved: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      archived: 'bg-slate-200 text-slate-700',
    };
    return map[status] ?? map.pending;
  };

  const tabs: { id: TabId; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'postos', label: 'Postos', icon: <MapPin size={16} />, count: stations.length },
    { id: 'pendentes', label: 'Pendentes', icon: <AlertTriangle size={16} />, count: derivedPending.length },
    { id: 'avaliacoes', label: 'Avaliações', icon: <MessageSquareWarning size={16} />, count: filteredReviews.length },
    { id: 'denuncias', label: 'Denúncias', icon: <ShieldAlert size={16} />, count: reports.length },
    { id: 'referencia', label: 'Referência', icon: <Fuel size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-secondary/20 pb-28 font-sans">
      <div className="bg-slate-900 px-4 pt-12 pb-20 rounded-b-[40px] shadow-2xl relative z-0">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Shield size={24} className="text-primary" /> Central do administrador
            </h1>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
              Tenant: {activeTenant?.name ?? 'Sem tenant'}
            </p>
            <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
              Acesso restrito: apenas contas marcadas como admin na API. Convide moderadores via <code className="text-slate-400">user_roles</code> / membership no backend.
            </p>
          </div>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar posto, usuário, denúncia ou comentário..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center">
            <MapPin size={20} className="text-blue-500 mb-1" />
            <span className="font-display font-bold text-xl">{stations.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Postos</span>
          </div>
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center">
            <Users size={20} className="text-green-500 mb-1" />
            <span className="font-display font-bold text-xl">{users.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Usuários</span>
          </div>
          <div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center">
            <ShieldAlert size={20} className="text-destructive mb-1" />
            <span className="font-display font-bold text-xl">{reports.length}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Denúncias</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm border-border'
                  : 'bg-muted/40 text-muted-foreground border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-primary/15 text-primary rounded-full px-1.5 min-w-[1.25rem] text-center">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'postos' && (
              <motion.div key="postos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {filteredStations.map((station) => (
                  <div key={station.id} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <button type="button" onClick={() => navigate(`/station/${station.id}`)} className="text-left">
                          <h3 className="font-bold text-sm hover:underline">{station.name}</h3>
                        </button>
                        <p className="text-[10px] text-muted-foreground">{station.address}</p>
                      </div>
                      {station.seal === 'trusted' ? (
                        <span className="flex-shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                          <ShieldCheck size={12} /> Confiável
                        </span>
                      ) : station.seal === 'complaints' ? (
                        <span className="flex-shrink-0 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                          <ShieldAlert size={12} /> Reclamações
                        </span>
                      ) : (
                        <span className="flex-shrink-0 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                          <AlertTriangle size={12} /> Observação
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SEAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdateSeal(station.id, opt.value)}
                          className={`py-2 px-3 rounded-lg text-[10px] font-bold border ${
                            station.seal === opt.value ? 'border-primary bg-primary/10' : 'border-border'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void openPriceEditor(station)}
                      className="w-full py-2 rounded-lg border border-dashed border-primary/40 text-xs font-bold text-primary flex items-center justify-center gap-2"
                    >
                      {expandedStationId === station.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      Atualizar preços dos combustíveis
                    </button>
                    {expandedStationId === station.id && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground">
                          Ajuste oficial dos valores exibidos no app (correção ou conferência ANP).
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_FUEL_TYPES.map((ft) => (
                            <label key={ft} className="text-[10px] space-y-1">
                              <span className="text-muted-foreground block">{FUEL_LABELS[ft]}</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={priceDraft[ft] ?? ''}
                                onChange={(e) => setPriceDraft((d) => ({ ...d, [ft]: e.target.value }))}
                                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm"
                                placeholder="0,00"
                              />
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={savingPricesId === station.id}
                          onClick={() => void handleSaveStationPrices(station.id)}
                          className="w-full py-2.5 rounded-lg bg-foreground text-background text-xs font-bold"
                        >
                          {savingPricesId === station.id ? 'Salvando...' : 'Salvar preços'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'pendentes' && (
              <motion.div key="pendentes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fila de cadastros que precisam de validação (duplicidade, CNPJ, endereço). A API pode enviar essa lista em{' '}
                  <code className="text-foreground/80">pending_stations</code> ou marcar <code className="text-foreground/80">approval_status: &quot;pending&quot;</code>.
                </p>
                {derivedPending.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-8">Nenhum posto pendente no momento.</p>
                ) : (
                  derivedPending.map((station) => (
                    <div key={station.id} className="bg-background border border-amber-200/50 rounded-xl p-4 shadow-sm space-y-3">
                      <div>
                        <h3 className="font-bold text-sm">{station.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{station.address}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApproval(station.id, 'approved')}
                          className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold"
                        >
                          Aprovar listagem
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleApproval(station.id, 'rejected')}
                          className="flex-1 py-2 rounded-lg border border-destructive text-destructive text-xs font-bold"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'avaliacoes' && (
              <motion.div key="avaliacoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowGuidelines((v) => !v)}
                  className="w-full flex items-center justify-between bg-background border border-border rounded-xl p-3 text-sm font-bold"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" /> Diretrizes de comentários
                  </span>
                  {showGuidelines ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showGuidelines && (
                  <ul className="text-xs text-muted-foreground space-y-2 bg-muted/30 rounded-xl p-4 border border-border/50 list-disc pl-4">
                    <li>Sem ofensas, difamação, dados pessoais de terceiros ou conteúdo irrelevante.</li>
                    <li>Comentários devem refletir experiência real de abastecimento naquele posto.</li>
                    <li>Quando houver prova em imagem, verifique se corresponde ao contexto (data, bomba, preço).</li>
                    <li>Em caso de dúvida, marque como não verificado ou solicite revisão no backend (histórico de moderação).</li>
                  </ul>
                )}
                {reviews.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhuma avaliação na fila. Peça ao backend para incluir <code className="text-foreground/80">reviews</code> ou{' '}
                    <code className="text-foreground/80">reviews_pending</code> em <code className="text-foreground/80">admin/overview</code>.
                  </p>
                )}
                {filteredReviews.map((review: AdminModerationReview) => (
                  <div key={review.id} className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-sm">{review.stations?.name ?? 'Posto'}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          Por {review.profiles?.display_name ?? 'Usuário'} · {review.rating} estrelas
                          {review.is_verified ? ' · já verificado' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                    <div className="flex flex-wrap gap-2">
                      {review.proof_url ? (
                        <a
                          href={review.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-primary underline"
                        >
                          Abrir prova
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleReviewModeration(review.id, true)}
                        className="flex-1 min-w-[120px] py-2 rounded-lg bg-green-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} /> Aprovar / verificar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReviewModeration(review.id, false)}
                        className="flex-1 min-w-[120px] py-2 rounded-lg border border-border text-xs font-bold"
                      >
                        Reprovar
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'denuncias' && (
              <motion.div key="denuncias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {filteredReports.map((report) => (
                  <div key={report.id} className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm">{report.stations?.name ?? 'Posto não encontrado'}</h3>
                        <p className="text-[10px] text-muted-foreground">Por {report.profiles?.display_name ?? 'Usuário'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${complaintBadge(report.status)}`}>
                        {COMPLAINT_STATUSES.find((s) => s.value === report.status)?.label ?? report.status}
                      </span>
                    </div>
                    <p className="text-sm">{report.description}</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {report.proof_url ? (
                        <a
                          href={report.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-center py-2 px-3 rounded-lg border border-border text-xs font-bold hover:bg-muted/50"
                        >
                          Ver prova
                        </a>
                      ) : null}
                      <select
                        value={report.status}
                        onChange={(e) => void handleComplaintStatus(report.id, e.target.value as ComplaintStatus)}
                        className="flex-1 bg-background border border-border rounded-lg py-2 px-3 text-xs font-medium"
                      >
                        {COMPLAINT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'referencia' && (
              <motion.div key="referencia" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Valores de referência por combustível (média regional, ANP ou teto interno). Servem para comparar cadastros e alertas — não substituem o preço publicado por cada posto até você atualizar na aba Postos.
                </p>
                <div className="bg-background border border-border rounded-xl p-4 space-y-3 shadow-sm">
                  {ALL_FUEL_TYPES.map((ft) => (
                    <label key={ft} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{FUEL_LABELS[ft]}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={refDraft[ft] ?? ''}
                        onChange={(e) => setRefDraft((d) => ({ ...d, [ft]: e.target.value }))}
                        className="w-28 bg-muted/50 border border-border rounded-lg p-2 text-right text-sm font-mono"
                        placeholder="—"
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    disabled={savingRef}
                    onClick={() => void handleSaveReferencePrices()}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
                  >
                    {savingRef ? 'Salvando...' : 'Salvar referência do tenant'}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Ideias extras no backend: log de auditoria das alterações, limite de denúncias por usuário/dia, export CSV de postos, integração com dados abertos da ANP, e papéis finos (owner vs moderador só-leitura).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminPanel;
