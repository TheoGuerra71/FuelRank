/**
 * Tela de autenticação do FuelRank (login, cadastro, recuperação).
 *
 * Decisões de UX / copy:
 * - O público são motoristas de app e condutores comuns: linguagem simples, benefício claro (economia + comunidade).
 * - Evitamos jargão de TI ("tenant", "cookie", "isolamento lógico") na interface; esses conceitos ficam só em comentários técnico-didáticos quando necessário.
 * - Mantemos os fluxos existentes (login, cadastro completo, esqueci senha, reset) para não quebrar o AuthContext.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Route, Shield, Sparkles } from 'lucide-react';
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

  /**
   * Títulos curtos e orientados à ação — o motorista entende em meio segundo o que vai fazer naquela etapa.
   */
  const pageTitle = useMemo(() => {
    if (mode === 'register') return 'Crie sua conta e comece a economizar';
    if (mode === 'forgot') return 'Recuperar sua senha';
    if (mode === 'reset') return 'Escolha uma nova senha';
    return 'Bem-vindo ao FuelRank';
  }, [mode]);

  const pageSubtitle = useMemo(() => {
    if (mode === 'register') return 'Leva menos de dois minutos. Você ajuda a comunidade a achar preço justo e posto confiável.';
    if (mode === 'reset') return 'Quase pronto: defina uma senha nova e volte a usar o app.';
    return 'Ache o combustível mais barato da sua região e fuja de fraudes com a ajuda de quem também dirige todo dia.';
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

    toast.success('Tudo certo! Bora economizar no abastecimento.');
    navigate('/');
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('As senhas não conferem. Confira e tente de novo.');
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

    /**
     * O backend já devolve JWT + sessão: o AuthContext grava o token e o usuário fica logado.
     * Mandamos o motorista direto para a Home — sem depender de e-mail neste ambiente local.
     */
    toast.success('Conta criada! Você já pode buscar os melhores preços.');
    setRegisterForm(initialRegisterState);
    navigate('/');
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

    toast.success('Te enviamos um link no e-mail. Olhe também a pasta de spam.');
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

    toast.success('Senha atualizada! Faça login com a senha nova.');
    setMode('login');
    navigate('/auth');
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Digite seu e-mail no campo acima para reenviarmos a confirmação.');
      return;
    }

    setLoading(true);
    const { error } = await resendVerificationEmail(email);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('E-mail de confirmação reenviado.');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Coluna esquerda: promessa de valor + tom humano (sem termos de infraestrutura). */}
        <section className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Route size={28} aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">FuelRank</h1>
              <p className="text-sm text-primary-foreground/85">O mapa colaborativo pra pagar menos no combustível.</p>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-6 text-primary-foreground/90">
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4">
              <MapPin className="mt-0.5 shrink-0" size={18} aria-hidden />
              <div>
                <strong className="font-semibold">Preço na palma da mão:</strong> compare postos perto de você antes de encostar na bomba e evite
                surpresa no caixa.
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4">
              <Sparkles className="mt-0.5 shrink-0" size={18} aria-hidden />
              <div>
                <strong className="font-semibold">Comunidade que avisa:</strong> junte-se ao FuelRank, avalie com histórico real e ajude o próximo a
                não cair em fraude ou gasolina adulterada.
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/10 p-4">
              <Shield className="mt-0.5 shrink-0" size={18} aria-hidden />
              <div>
                <strong className="font-semibold">Conta protegida:</strong> seu cadastro usa os mesmos cuidados de apps grandes: e-mail de confirmação
                e recuperação de senha quando precisar.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{pageTitle}</h2>
            {(mode === 'login' || mode === 'reset' || mode === 'register') && (
              <p className="mt-2 text-sm text-muted-foreground">{pageSubtitle}</p>
            )}
            {mode === 'forgot' && (
              <p className="mt-2 text-sm text-muted-foreground">
                Informe o e-mail da sua conta. Mandamos um link seguro pra você criar outra senha.
              </p>
            )}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>
              Entrar
            </Button>
            <Button type="button" variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')}>
              Criar conta
            </Button>
            <Button type="button" variant={mode === 'forgot' ? 'default' : 'outline'} onClick={() => setMode('forgot')}>
              Esqueci a senha
            </Button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar e ver os postos'}
              </Button>
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
              <button type="button" onClick={handleResendVerification} className="block text-sm text-primary hover:underline">
                Não recebeu o e-mail de confirmação? Reenviar
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Nome como no documento"
                value={registerForm.displayName}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, displayName: e.target.value }))}
                required
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                placeholder="Celular / WhatsApp"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <Input placeholder="CPF" value={registerForm.cpf} onChange={(e) => setRegisterForm((prev) => ({ ...prev, cpf: e.target.value }))} required />
              <Input
                placeholder="ID interno (opcional para sua operação)"
                value={registerForm.documentId}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, documentId: e.target.value }))}
                required
              />
              <Input
                placeholder="Empresa ou como quer aparecer"
                value={registerForm.companyName}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, companyName: e.target.value }))}
                required
              />
              <Input
                placeholder="Identificador da sua rede (ex: sul-sp)"
                value={registerForm.tenantSlug}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, tenantSlug: e.target.value.toLowerCase() }))}
                required
              />
              <Input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
              <div className="md:col-span-2">
                <Input
                  type="password"
                  placeholder="Confirmar senha"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="md:col-span-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                O identificador da rede (campo curto, sem espaços) agrupa os postos e preços da sua região ou cooperativa. Se você só quer usar o app
                como motorista, pode colocar um apelido simples — o importante é você começar a colaborar.
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando sua conta...' : 'Criar conta e juntar-se à comunidade'}
                </Button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input type="email" placeholder="E-mail da conta" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Use uma senha que você não reutiliza em outros sites e que seja fácil de lembrar só para você.
              </div>
              <Input
                type="password"
                placeholder="Nova senha"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar e voltar ao login'}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Auth;
