import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import SSLBadge from "@/components/SSLBadge";
import { Button } from "@/components/ui/button";
import { Parallax } from "@/components/Parallax";
import { ImageTextSection } from "@/components/ImageTextSection";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Zap, Calendar, FileText, Shield } from "lucide-react";
import { FiShield, FiFileText, FiCalendar } from 'react-icons/fi';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSecureAccess = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-warning mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
            <strong className="text-foreground">
              criptografia SSL 256-bit
            </strong>
            .
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
            <Button
              size="lg"
              className="px-8 py-3 text-base bg-gray-700"
              onClick={handleSecureAccess}
            >
              <Lock className="w-5 h-5 mr-2" />
              {isAuthenticated ? "Área Logada" : "Acesso Seguro"}
            </Button>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-warning" />
            <span>
              Seu escritório digital com criptografia militar SSL 256-bit
            </span>
          </div>
        </div>
      </main>
      <Parallax
        backgroundImage="/img/imagemt.jpg"
        title="Soluções Jurídicas Inteligentes"
        subtitle="Tecnologia de ponta para otimizar sua prática advocatícia"
      />
      
      <ImageTextSection
        imageUrl="/img/escritorio.jpg"
        title="Sua advocacia mais eficiente"
        text="Reduza o tempo com burocracia e foque no que realmente importa"
        features={[
          "Automação de processos repetitivos",
          "Gestão de documentos segura",
          "Colaboração em tempo real"
        ]}
      />
      
      <FeaturesGrid
        title="Nossos Diferenciais"
        features={[
          {
            icon: <FiShield className="w-6 h-6 text-blue-600" />,
            title: "Segurança 256-bit",
            description: "Proteção militar para seus dados sensíveis"
          },
          {
            icon: <FiFileText className="w-6 h-6 text-blue-600" />,
            title: "Petições Automáticas",
            description: "Geração de documentos com um clique"
          },
          {
            icon: <FiCalendar className="w-6 h-6 text-blue-600" />,
            title: "Gestão de Prazos",
            description: "Alertas inteligentes para não perder datas importantes"
          }
        ]}
      />
      <Footer />
      <SSLBadge />
    </div>
  );
};

export default Index;
