import Header from "@/components/Header";
import FeatureCard from "@/components/FeatureCard";
import SSLBadge from "@/components/SSLBadge";
import { Button } from "@/components/ui/button";
import { 
  Lock, 
  Zap, 
  Calendar, 
  FileText, 
  Shield 
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="mb-6">
            <Lock className="w-12 h-12 text-warning mx-auto mb-4" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            🔒 Facilite sua advocacia <br />
            com tecnologia de ponta
          </h1>
          
          <p className="text-lg text-muted-foreground mb-2 max-w-2xl mx-auto">
            Automatize tarefas, organize processos e proteja seus dados com{" "}
            <strong className="text-foreground">criptografia SSL 256-bit</strong>.
          </p>
          
          <p className="text-lg text-muted-foreground mb-12">
            A plataforma mais segura para escritórios de advocacia.
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <FeatureCard 
              icon={<Zap />} 
              title="Automação de tarefas por IA"
              iconColor="text-warning"
            />
            <FeatureCard 
              icon={<Lock />} 
              title="Criptografia SSL 256-bit"
              iconColor="text-success"
            />
            <FeatureCard 
              icon={<Calendar />} 
              title="Agenda automática e notificações"
              iconColor="text-destructive"
            />
            <FeatureCard 
              icon={<FileText />} 
              title="Geração de petições e documentos"
              iconColor="text-primary"
            />
          </div>
          
          {/* CTA Button */}
          <div className="mb-6">
            <Button variant="purple" size="lg" className="px-8 py-3 text-base">
              <Lock className="w-5 h-5 mr-2" />
              Acesso Seguro
            </Button>
          </div>
          
          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-warning" />
            <span>Seu escritório digital com criptografia militar SSL 256-bit</span>
          </div>
        </div>
      </main>
      
      <SSLBadge />
    </div>
  );
};

export default Index;