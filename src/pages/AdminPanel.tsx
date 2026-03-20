import { useTenant } from '@/contexts/TenantContext';
import { apiRequest } from '@/lib/api';
import type { AdminComplaint, ProfileRow, StationRow } from '@/types/app';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle, MapPin, Search, Shield, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { activeTenant } = useTenant();
  const [activeTab, setActiveTab] = useState('postos');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState<StationRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [reports, setReports] = useState<AdminComplaint[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const payload = await apiRequest<{ stations: StationRow[]; users: ProfileRow[]; reports: AdminComplaint[] }>('admin/overview', { query: { tenantId: activeTenant?.id } });
        setStations(payload.stations);
        setUsers(payload.users);
        setReports(payload.reports);
      } catch (error) {
        console.error('Erro ao buscar dados do painel:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAdminData();
  }, [activeTenant?.id]);

  const handleUpdateSeal = async (stationId: string, newSeal: StationRow['seal']) => {
    await apiRequest(`admin/stations/${stationId}/seal`, { method: 'PATCH', body: JSON.stringify({ seal: newSeal }) });
    setStations((currentStations) => currentStations.map((station) => station.id === stationId ? { ...station, seal: newSeal } : station));
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredStations = useMemo(() => stations.filter((station) => !normalizedSearch || station.name.toLowerCase().includes(normalizedSearch) || station.address.toLowerCase().includes(normalizedSearch)), [normalizedSearch, stations]);
  const filteredUsers = useMemo(() => users.filter((user) => !normalizedSearch || user.display_name.toLowerCase().includes(normalizedSearch)), [normalizedSearch, users]);
  const filteredReports = useMemo(() => reports.filter((report) => !normalizedSearch || [report.description, report.stations?.name, report.profiles?.display_name].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedSearch))), [normalizedSearch, reports]);

  return <div className="min-h-screen bg-secondary/20 pb-24 font-sans"><div className="bg-slate-900 px-4 pt-12 pb-20 rounded-b-[40px] shadow-2xl relative z-0"><div className="flex items-center gap-3 mb-6"><button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><ArrowLeft size={20} /></button><div><h1 className="font-display text-2xl font-bold text-white flex items-center gap-2"><Shield size={24} className="text-primary" /> Central de Comando</h1><p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Tenant: {activeTenant?.name ?? 'Sem tenant'}</p></div></div><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar posto, usuário ou denúncia..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white" /></div></div><div className="px-4 -mt-12 relative z-10"><div className="grid grid-cols-3 gap-3"><div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center"><MapPin size={20} className="text-blue-500 mb-1" /><span className="font-display font-bold text-xl">{stations.length}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">Postos</span></div><div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center"><Users size={20} className="text-green-500 mb-1" /><span className="font-display font-bold text-xl">{users.length}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">Usuários</span></div><div className="bg-background rounded-2xl p-4 shadow-lg border border-border/50 flex flex-col items-center"><AlertTriangle size={20} className="text-destructive mb-1" /><span className="font-display font-bold text-xl">{reports.length}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">Denúncias</span></div></div></div><div className="px-4 mt-6 mb-4"><div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">{[{ id: 'postos', label: 'Postos', icon: <MapPin size={16} /> }, { id: 'usuarios', label: 'Usuários', icon: <Users size={16} /> }, { id: 'denuncias', label: 'Denúncias', icon: <ShieldAlert size={16} /> }].map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg ${activeTab === tab.id ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground'}`}>{tab.icon} {tab.label}</button>)}</div></div><div className="px-4 space-y-4">{isLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div> : <AnimatePresence mode="wait">{activeTab === 'postos' && <motion.div key="postos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">{filteredStations.map((station) => <div key={station.id} className="bg-background border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3"><div className="flex justify-between items-start"><div><h3 className="font-bold text-sm">{station.name}</h3><p className="text-[10px] text-muted-foreground">{station.address}</p></div>{station.seal === 'trusted' ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12} /> Confiável</span> : <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><ShieldAlert size={12} /> Observação</span>}</div><div className="flex gap-2"><button onClick={() => handleUpdateSeal(station.id, 'trusted')} className="flex-1 py-2 rounded-lg text-xs font-bold border">Tornar confiável</button><button onClick={() => handleUpdateSeal(station.id, 'complaints')} className="flex-1 py-2 rounded-lg text-xs font-bold border">Marcar fraude</button></div></div>)}</motion.div>}{activeTab === 'usuarios' && <motion.div key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">{filteredUsers.map((user) => <div key={user.id} className="bg-background border border-border rounded-xl p-3 flex items-center gap-4 shadow-sm"><div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{user.display_name?.charAt(0)?.toUpperCase() || 'U'}</div><div className="flex-1"><p className="font-bold text-sm">{user.display_name}</p><p className="text-[10px] text-muted-foreground">{user.influence_level}</p></div></div>)}</motion.div>}{activeTab === 'denuncias' && <motion.div key="denuncias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">{filteredReports.map((report) => <div key={report.id} className="bg-background border border-border rounded-xl p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-sm">{report.stations?.name ?? 'Posto não encontrado'}</h3><p className="text-[10px] text-muted-foreground">Enviado por {report.profiles?.display_name ?? 'Usuário'}</p></div><span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded">Pendente</span></div><p className="text-sm mt-3">{report.description}</p><div className="grid grid-cols-2 gap-2 mt-3"><a href={report.proof_url} target="_blank" rel="noreferrer" className="text-center py-2 rounded-lg border border-border text-xs font-bold hover:bg-muted/50">Ver prova</a><button className="py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1" disabled><CheckCircle size={14} /> Fluxo preparado</button></div></div>)}</motion.div>}</AnimatePresence>}</div></div>;
};

export default AdminPanel;
