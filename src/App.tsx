import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ProcessView from "./pages/ProcessView.tsx";
import ProcessFinancial from "./pages/ProcessFinancial.tsx";
import NewProcess from "./pages/NewProcess.tsx";
import Financial from "./pages/Financial.tsx";
import NotFound from "./pages/NotFound.tsx";
import IAFacilita from "./pages/IAFacilita.tsx";
import GoogleIntegration from "./pages/GoogleIntegration.tsx";
import CalendarManagement from "./pages/CalendarManagement.tsx";
import FaciliSign from "./pages/FaciliSign.tsx";
import UserManagement from "./pages/UserManagement.tsx";
import { GoogleCallback } from "./pages/GoogleCallback.tsx";
import TermosServico from "./pages/TermosServico.tsx";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade.tsx";
import Contato from "./pages/Contato.tsx";
import Sobre from "./pages/Sobre.tsx";
import Servicos from "./pages/Servicos.tsx";
import { PrivateRoute } from "./components/PrivateRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/termos-servico" element={<TermosServico />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/servicos" element={<Servicos />} />

          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/novo-processo" element={<NewProcess />} />
            <Route path="/processo/:id" element={<ProcessView />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/financeiro/cliente/:clienteNome" element={<ProcessFinancial />} />
            <Route path="/ia-facilita" element={<IAFacilita />} />
            <Route path="/facilisign" element={<FaciliSign />} />
            <Route path="/google-integration" element={<GoogleIntegration />} />
            <Route path="/google-integration/callback" element={<GoogleCallback />} />
            <Route path="/calendar" element={<CalendarManagement />} />
          </Route>

          {/* Outras Rotas */}
          <Route path="/_/IdpIFrameHttp/cspreport/fine-allowlist" element={<CSPReportHandler />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const CSPReportHandler = () => {
  useEffect(() => {
    console.log('CSP Report received');
    return () => {};
  }, []);

  return null; 
};

export default App;
