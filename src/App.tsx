import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import VerificarEmail from "./pages/VerificarEmail";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="cardapio" replace />} />
            <Route path="cardapio" element={<Cardapio />} />
            <Route path="modo-esporte" element={<ModoEsporte />} />
            <Route path="analisador-prato" element={<AnalisadorPrato />} />
            <Route path="progresso" element={<Progresso />} />
            <Route path="receitas" element={<Receitas />} />
            <Route path="chat" element={<Chat />} />
            <Route path="score" element={<ScoreDiario />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
