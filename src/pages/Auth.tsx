import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Fuel, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

interface RegisterFormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cpf: string;
  documentId: string;
  companyName: string;
  tenantSlug: string;
}

const initialRegisterState: RegisterFormState = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  cpf: '',
  documentId: '',
  companyName: '',
  tenantSlug: '',
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlMode = searchParams.get('mode');
  const inferredMode: AuthMode = urlMode === 'reset' ? 'reset' : 'login';
  const [mode, setMode] = useState<AuthMode>(inferredMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterState);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, requestPasswordReset, updatePassword, resendVerificationEmail } = useAuth();

  const pageTitle = useMemo(() => {
    if (mode === 'register') return 'Cadastro completo da sua operação';
    if (mode === 'forgot') return 'Recuperar acesso';
    if (mode === 'reset') return 'Definir nova senha';
    return 'Acesse seu tenant com segurança';
  }, [mode]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Login realizado com sucesso.');
    navigate('/');
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: registerForm.email,
      password: registerForm.password,
      displayName: registerForm.displayName,
      phone: registerForm.phone,
      cpf: registerForm.cpf,
      documentId: registerForm.documentId,
      companyName: registerForm.companyName,
      tenantSlug: registerForm.tenantSlug,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Conta criada. Verifique seu e-mail para ativar o tenant e concluir a segurança da conta.');
    setMode('login');
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Enviamos o link de redefinição para o seu e-mail.');
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await updatePassword(resetPassword);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Senha atualizada com sucesso. Faça login novamente.');
    setMode('login');
    navigate('/auth');
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Informe seu e-mail para reenviar a verificação.');
      return;
    }

    setLoading(true);
    const { error } = await resendVerificationEmail(email);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('E-mail de verificação reenviado.');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Fuel size={28} /></div>
            <div>
              <h1 className="font-display text-3xl font-bold">FuelRank Cloud</h1>
              <p className="text-sm text-primary-foreground/80">Multi-tenant, autenticação em cookies e trilha completa de conta.</p>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-6 text-primary-foreground/90">
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4"><Building2 className="mt-0.5" size={18} /><div><strong>Tenant isolado:</strong> cada operação passa a trabalhar com tenant próprio, facilitando escalar clientes com isolamento lógico.</div></div>
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4"><ShieldCheck className="mt-0.5" size={18} /><div><strong>Sessão em cookie:</strong> o cliente do Supabase agora persiste sessão em cookie com `SameSite=Strict` e `Secure` quando disponível.</div></div>
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4"><MailCheck className="mt-0.5" size={18} /><div><strong>Conta completa:</strong> cadastro com dados pessoais, empresa, verificação de e-mail e fluxo de recuperação de senha.</div></div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{pageTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Comentários no código foram mantidos para explicar decisões importantes da autenticação e do multi-tenant.</p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>Login</Button>
            <Button type="button" variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')}>Cadastro</Button>
            <Button type="button" variant={mode === 'forgot' ? 'default' : 'outline'} onClick={() => setMode('forgot')}>Esqueci a senha</Button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">Esqueci minha senha</button>
              <button type="button" onClick={handleResendVerification} className="block text-sm text-primary hover:underline">Reenviar verificação de e-mail</button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Nome completo" value={registerForm.displayName} onChange={(e) => setRegisterForm((prev) => ({ ...prev, displayName: e.target.value }))} required />
              <Input type="email" placeholder="E-mail" value={registerForm.email} onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))} required />
              <Input placeholder="Telefone" value={registerForm.phone} onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              <Input placeholder="CPF" value={registerForm.cpf} onChange={(e) => setRegisterForm((prev) => ({ ...prev, cpf: e.target.value }))} required />
              <Input placeholder="Documento interno / matrícula" value={registerForm.documentId} onChange={(e) => setRegisterForm((prev) => ({ ...prev, documentId: e.target.value }))} required />
              <Input placeholder="Empresa / Rede" value={registerForm.companyName} onChange={(e) => setRegisterForm((prev) => ({ ...prev, companyName: e.target.value }))} required />
              <Input placeholder="Slug do tenant (ex: rede-centro)" value={registerForm.tenantSlug} onChange={(e) => setRegisterForm((prev) => ({ ...prev, tenantSlug: e.target.value.toLowerCase() }))} required />
              <Input type="password" placeholder="Senha" value={registerForm.password} onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))} required minLength={6} />
              <div className="md:col-span-2">
                <Input type="password" placeholder="Confirmar senha" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} required minLength={6} />
              </div>
              <div className="md:col-span-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Comentário importante: o slug do tenant vira a identidade lógica da empresa. Em ambiente real, isso simplifica isolamento entre clientes e futuras integrações de billing/onboarding.
              </div>
              <div className="md:col-span-2"><Button type="submit" className="w-full" disabled={loading}>{loading ? 'Criando conta...' : 'Criar conta e enviar verificação'}</Button></div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input type="email" placeholder="E-mail da conta" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link de recuperação'}</Button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground flex gap-3"><KeyRound size={18} className="mt-0.5" /> Defina uma nova senha forte. O Supabase validará o token vindo do e-mail automaticamente.</div>
              <Input type="password" placeholder="Nova senha" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Atualizando...' : 'Salvar nova senha'}</Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Auth;
