import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// 🚧 TELA DE 404 (Página Não Encontrada)
// Este componente é o "Goleiro" do nosso sistema de rotas (no App.tsx). 
// Se o usuário digitar uma URL maluca (ex: fuelrank.com/batata-frita), ele é jogado pra cá.
const NotFound = () => {
  // 📍 O "Radar" do React Router
  // O hook useLocation nos dá acesso aos detalhes da URL atual que está no navegador.
  // Precisamos disso para descobrir exatamente em qual buraco negro o usuário tentou entrar.
  const location = useLocation();

  // ==========================================
  // 🕵️‍♂️ TELEMETRIA E DEBUG (A "Caixa Preta")
  // ==========================================
  // O useEffect roda silenciosamente nos bastidores. 
  useEffect(() => {
    // Nós jogamos esse erro no console (F12) para os desenvolvedores verem.
    // DICA PARA O FUTURO: Em produção, você pode trocar esse console.error por um envio para
    // o Sentry ou Google Analytics. Assim, se você lançar uma atualização e esquecer 
    // um link quebrado, você vai saber exatamente qual link está dando erro 404!
    console.error(
      "404 Error: User attempted to access non-existent route:", 
      location.pathname // Mostra a rota específica que causou o problema
    );
  }, [location.pathname]); // O array de dependência garante que isso só dispare quando a rota mudar, evitando loops infinitos de erro.

  // ==========================================
  // RENDERIZAÇÃO DA TELA (O Visual do Limbo)
  // ==========================================
  return (
    // O clássico combo do Tailwind para centralizar TUDO perfeitamente no meio da tela:
    // 'min-h-screen' (altura total) + 'flex' + 'items-center' (meio vertical) + 'justify-center' (meio horizontal).
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        
        {/* O título gigante avisando o código do erro */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        
        {/* 🔗 Botão de Resgate
            Diferente de outras telas onde usamos o <Link> do React Router, aqui estamos usando 
            a tag <a> normal do HTML. Por quê? Porque um href="/" força o navegador a dar um 
            "Hard Reload" (recarregar a página inteira). Se o usuário caiu num 404 porque 
            a memória do app deu algum "tilt", recarregar a página zera tudo e salva a vida dele! */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
        
      </div>
    </div>
  );
};

export default NotFound;