import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AddStation from "./pages/AddStation"; // Certifique-se que este arquivo existe em src/pages/
import AdminPanel from "./pages/AdminPanel";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Ranking from "./pages/Ranking";
import RefuelHistory from "./pages/RefuelHistory";
import SearchPage from "./pages/SearchPage";
import StationDetail from "./pages/StationDetail";

// 1. Nova importação da super tela de Avaliação/Denúncia!
import EvaluateStation from "./pages/EvaluateStation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de Login */}
            <Route path="/auth" element={<Auth />} />

            {/* Rotas Principais - Sem ProtectedRoute para destravar o carregamento */}
            <Route path="/" element={<Index />} />
            <Route path="/station/:id" element={<StationDetail />} />
            
            {/* 2. Rota ATUALIZADA para a nova super tela de Avaliação! */}
            <Route path="/station/:id/evaluate" element={<EvaluateStation />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/refuels" element={<RefuelHistory />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Rota do Painel Admin - Liberada para acesso direto */}
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Rota para o botão + funcionar e registrar o caso do GNV */}
            <Route path="/add-station" element={<AddStation />} />

            {/* Rota para páginas inexistentes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;