import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Fuel } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// 🔐 Tela de Autenticação: A porta de entrada do FuelRank.
// Aqui nós juntamos Login e Cadastro na mesma tela para facilitar a vida do usuário.
const Auth = () => {
  // ==========================================
  // ESTADOS DA TELA (Memória do Componente)
  // ==========================================
  
  // 🔄 O grande truque da tela: esse estado define se estamos no modo "Login" (true) ou "Cadastro" (false).
  // Quando ele muda, a tela se adapta automaticamente, mostrando ou escondendo o campo de nome.
  const [isLogin, setIsLogin] = useState(true);
  
  // Campos que o usuário vai digitar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  // ⏳ Trava do botão: impede que o cara clique 50 vezes enquanto o servidor pensa
  const [loading, setLoading] = useState(false);
  
  // ==========================================
  // HOOKS (Ferramentas externas)
  // ==========================================
  
  // 🧠 O nosso Cérebro de Autenticação (criado em AuthContext.tsx).
  // Ele que conversa de verdade com o Supabase nos bastidores.
  const { signIn, signUp } = useAuth();
  
  // 🧭 O nosso "motorista" para mudar de página.
  const navigate = useNavigate();

  // ==========================================
  // O GRANDE MOMENTO: ENVIO DO FORMULÁRIO
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o navegador de dar refresh na página (padrão irritante do HTML)
    setLoading(true); // Gira a rodinha do botão

    if (isLogin) {
      // 🟢 FLUXO DE LOGIN
      const { error } = await signIn(email, password); // Tenta logar no Supabase
      if (error) {
        // Se deu ruim (senha errada, etc), mostra o balãozinho vermelho de erro.
        toast.error(error.message);
      } else {
        // Se deu bom, manda o cara direto pra tela principal (Index/Radar)!
        navigate("/");
      }
    } else {
      // 🔵 FLUXO DE CADASTRO
      
      // Validação de segurança: Não deixa o cara criar conta sem nome
      if (!displayName.trim()) {
        toast.error("Informe seu nome.");
        setLoading(false);
        return; // Interrompe a função aqui mesmo
      }

      const { error } = await signUp(email, password, displayName); // Tenta criar a conta
      if (error) {
        toast.error(error.message);
      } else {
        // No Supabase, geralmente contas novas exigem confirmação por e-mail por segurança.
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    }
    
    // Independentemente de dar certo ou errado, libera o botão para ser clicado de novo.
    setLoading(false);
  };

  // ==========================================
  // RENDERIZAÇÃO DA TELA (O visual)
  // ==========================================
  return (
    // min-h-screen garante que a tela ocupe 100% da altura do celular/monitor
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        
        {/* 🎩 Logo e Boas-vindas Dinâmicas */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Fuel size={28} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">FuelRank</h1>
          {/* Se isLogin for true, mostra um texto. Se for false, mostra outro. Elegante! */}
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Faça login para continuar" : "Crie sua conta"}
          </p>
        </div>

        {/* 📝 O Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* MÁGICA: O campo "Seu nome" SÓ aparece se estivermos no modo "Cadastro" (!isLogin) */}
          {!isLogin && (
            <Input
              placeholder="Seu nome"
              value={displayName} // O value é "amarrado" ao estado
              onChange={(e) => setDisplayName(e.target.value)} // Atualiza o estado a cada tecla digitada
              className="bg-card border-border"
            />
          )}
          
          <Input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required // Trava nativa do HTML: impede de enviar vazio
            className="bg-card border-border"
          />
          
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6} // O Supabase exige no mínimo 6 caracteres, então já barramos aqui no frontend!
            className="bg-card border-border"
          />
          
          {/* Botão Dinâmico: Muda o texto se estiver logando, cadastrando ou carregando */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        {/* 🔄 Link para alternar entre Login e Cadastro */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)} // Inverte o valor do isLogin (se era true vira false e vice-versa)
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;