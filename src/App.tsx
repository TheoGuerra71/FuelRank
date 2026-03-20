import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AddStation from './pages/AddStation';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';
import EvaluateStation from './pages/EvaluateStation';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Ranking from './pages/Ranking';
import RefuelHistory from './pages/RefuelHistory';
import SearchPage from './pages/SearchPage';
import StationDetail from './pages/StationDetail';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/station/:id" element={<StationDetail />} />
              <Route path="/station/:id/evaluate" element={<ProtectedRoute><EvaluateStation /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/refuels" element={<ProtectedRoute><RefuelHistory /></ProtectedRoute>} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
              <Route path="/add-station" element={<ProtectedRoute><AddStation /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
