import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewProcess from "./pages/NewProcess";
import ProcessView from "./pages/ProcessView";
import Financial from "./pages/Financial";
import ProcessFinancial from "./pages/ProcessFinancial";
import IAFacilita from "./pages/IAFacilita";
import FaciliSign from "./pages/FaciliSign";
import GoogleIntegration from "./pages/GoogleIntegration";
import CalendarManagement from "./pages/CalendarManagement";
import NotFound from "./pages/NotFound";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/novo-processo" element={<NewProcess />} />
          <Route path="/processo/:id" element={<ProcessView />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/financeiro/cliente/:clienteNome" element={<ProcessFinancial />} />
          <Route path="/ia-facilita" element={<IAFacilita />} />
          <Route path="/facilisign" element={<FaciliSign />} />
          <Route path="/google-integration" element={<GoogleIntegration />} />
          <Route path="/calendar" element={<CalendarManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
