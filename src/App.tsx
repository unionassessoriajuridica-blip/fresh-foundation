import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProcessView from "./pages/ProcessView";
import ProcessFinancial from "./pages/ProcessFinancial";
import NewProcess from "./pages/NewProcess";
import Financial from "./pages/Financial";
import NotFound from "./pages/NotFound";
import IAFacilita from "./pages/IAFacilita";
import GoogleIntegration from "./pages/GoogleIntegration";
import CalendarManagement from "./pages/CalendarManagement";
import FaciliSign from "./pages/FaciliSign";
import UserManagement from "./pages/UserManagement";
import { GoogleCallback } from "./pages/GoogleCallback";
import TermosServico from "./pages/TermosServico";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/novo-processo" element={<NewProcess />} />
          <Route path="/processo/:id" element={<ProcessView />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route
            path="/financeiro/cliente/:clienteNome"
            element={<ProcessFinancial />}
          />
          <Route path="/ia-facilita" element={<IAFacilita />} />
          <Route path="/facilisign" element={<FaciliSign />} />

          <Route path="/google-integration" element={<GoogleIntegration />} />
          <Route path="/google-integration/callback" element={<GoogleCallback />}
          />
          <Route path="/calendar" element={<CalendarManagement />} />
          <Route path="*" element={<NotFound />} />
        <Route path="/termos-servico" element={<TermosServico />} />
        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
