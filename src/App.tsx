import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import EscolherPlano from "./pages/EscolherPlano";
import Login from "./pages/Login";
import VerificarEmail from "./pages/VerificarEmail";
import CheckoutSucesso from "./pages/CheckoutSucesso";
import Planos from "./pages/Planos";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import Cardapio from "./pages/dashboard/Cardapio";
import Receitas from "./pages/dashboard/Receitas";
import Chat from "./pages/dashboard/Chat";
import Configuracoes from "./pages/dashboard/Configuracoes";
import ModoEsporte from "./pages/dashboard/ModoEsporte";
import Progresso from "./pages/dashboard/Progresso";
import AnalisadorPrato from "./pages/dashboard/AnalisadorPrato";
import ScoreDiario from "./pages/dashboard/ScoreDiario";
import Conquistas from "./pages/dashboard/Conquistas";
import Favoritos from "./pages/dashboard/Favoritos";
import AdaptadorDieta from "./pages/dashboard/AdaptadorDieta";
import Jornada from "./pages/dashboard/Jornada";

import Admin from "./pages/dashboard/Admin";
import { PlanGate } from "./components/dashboard/PlanGate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min — instant back-navigation
      gcTime: 1000 * 60 * 30, // 30 min in-memory cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/escolher-plano" element={<EscolherPlano />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/checkout/sucesso" element={<CheckoutSucesso />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="cardapio" replace />} />
            <Route path="cardapio" element={<Cardapio />} />
            <Route path="modo-esporte" element={<PlanGate feature="modoEsporte" requiredPlan="Equilíbrio"><ModoEsporte /></PlanGate>} />
            <Route path="analisador-prato" element={<PlanGate feature="analisadorPrato" requiredPlan="Essencial"><AnalisadorPrato /></PlanGate>} />
            <Route path="progresso" element={<PlanGate feature="progresso" requiredPlan="Equilíbrio"><Progresso /></PlanGate>} />
            <Route path="receitas" element={<PlanGate feature="receitas" requiredPlan="Essencial"><Receitas /></PlanGate>} />
            <Route path="chat" element={<PlanGate feature="chat" requiredPlan="Essencial"><Chat /></PlanGate>} />

            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="score" element={<PlanGate feature="scoreDiario" requiredPlan="Performance"><ScoreDiario /></PlanGate>} />
            <Route path="conquistas" element={<PlanGate feature="conquistas" requiredPlan="Performance"><Conquistas /></PlanGate>} />
            <Route path="favoritos" element={<Favoritos />} />
            <Route path="adaptador-dieta" element={<AdaptadorDieta />} />
            <Route path="jornada" element={<Jornada />} />
            
            
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
