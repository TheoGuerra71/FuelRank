import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { apiRequest } from '@/lib/api';
import type { ProfileRow } from '@/types/app';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, Flame, LogOut, Save, Shield, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { signOut, user, updateProfile } = useAuth();
  const { tenants, activeTenant, setActiveTenantId } = useTenant();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState({ display_name: '', phone: '', cpf: '', company_name: '', document_id: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiRequest<ProfileRow>('profile');
        setProfile(data);
        setFormState({
          display_name: data.display_name,
          phone: data.phone ?? '',
          cpf: data.cpf ?? '',
          company_name: data.company_name ?? '',
          document_id: data.document_id ?? '',
        });
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const { error } = await updateProfile({ display_name: formState.display_name, phone: formState.phone || null, cpf: formState.cpf || null });
    setIsSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setProfile((current) => current ? { ...current, display_name: formState.display_name, phone: formState.phone, cpf: formState.cpf } : current);
    toast.success('Dados pessoais atualizados com sucesso.');
  };

  const currentPoints = profile?.points ?? 0;
  const progressPercent = Math.min((currentPoints / 500) * 100, 100);
  const activeTenantLabel = useMemo(() => activeTenant?.name ?? 'Nenhum tenant ativo', [activeTenant]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <div className="bg-primary px-4 pt-12 pb-20 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-xl font-bold text-primary-foreground">Meu Perfil</h1>
          <button onClick={handleLogout} className="p-2 text-primary-foreground/80 hover:text-primary-foreground"><LogOut size={20} /></button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-background border-4 border-primary-foreground/20 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-display font-bold text-primary">{profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">{profile?.display_name || 'Usuário FuelRank'}</h2>
            <div className="flex items-center gap-1.5 mt-1 bg-black/20 px-2.5 py-1 rounded-full w-fit backdrop-blur-sm">
              <Trophy size={12} className="text-yellow-400" />
              <span className="text-xs font-medium text-primary-foreground/90">{profile?.influence_level || 'Iniciante'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Seus Pontos</p>
              <h3 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">{currentPoints} <Flame size={20} className="text-orange-500" /></h3>
            </div>
            <p className="text-sm font-bold text-foreground">Tenant atual: {activeTenantLabel}</p>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden mt-4"><motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full" /></div>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2"><Shield size={18} className="text-primary" /> Dados pessoais</h3>
            <p className="text-sm text-muted-foreground mt-1">Área completa de cadastro para manter a identidade do usuário consistente entre autenticação, perfil e tenant.</p>
          </div>
          <Input placeholder="Nome completo" value={formState.display_name} onChange={(e) => setFormState((prev) => ({ ...prev, display_name: e.target.value }))} />
          <Input placeholder="Telefone" value={formState.phone} onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))} />
          <Input placeholder="CPF" value={formState.cpf} onChange={(e) => setFormState((prev) => ({ ...prev, cpf: e.target.value }))} />
          <Input placeholder="Empresa / Rede" value={formState.company_name} disabled />
          <Input placeholder="Documento interno / matrícula" value={formState.document_id} disabled />
          <Button type="submit" className="w-full" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar dados pessoais'}</Button>
        </motion.form>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2"><Building2 size={18} className="text-primary" /> Workspace / Tenant</h3>
              <p className="text-sm text-muted-foreground">Trocar o tenant atual atualiza o escopo de consultas do app.</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
          <select value={activeTenant?.id ?? ''} onChange={(e) => setActiveTenantId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm">
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} • {tenant.role}</option>)}
          </select>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
