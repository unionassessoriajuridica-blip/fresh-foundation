import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Loader2 } from "lucide-react";

export const GoogleCallback = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const googleAuth = useGoogleAuth({
    clientId: "90141190775-qqgb05aq59fmqegieiguk4gq0u0140sp.apps.googleusercontent.com",
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar"
    ]
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extrai o código da URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error("Código de autorização não encontrado");
        }

        // Troca o código por um token de acesso
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: googleAuth.clientId,
            client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
            redirect_uri: `${window.location.origin}/google-integration/callback`,
            grant_type: 'authorization_code',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Falha na autenticação");
        }

        // Armazena os tokens e redireciona
        localStorage.setItem('google_access_token', data.access_token);
        localStorage.setItem('google_refresh_token', data.refresh_token);
        
        // Atualiza o estado de autenticação
        googleAuth.setAccessToken(data.access_token);
        googleAuth.setIsAuthenticated(true);

        // Redireciona para a página de integração com sucesso
        navigate('/google-integration?success=true');
      } catch (err) {
        console.error('Erro no callback:', err);
        toast({
          title: "Erro na autenticação",
          description: err.message,
          variant: "destructive",
        });
        navigate('/google-integration?error=true');
      }
    };

    handleCallback();
  }, [location, navigate, toast, googleAuth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin" />
        <h1 className="text-2xl font-bold">Processando autenticação...</h1>
        <p className="text-muted-foreground">
          Por favor, aguarde enquanto conectamos sua conta Google.
        </p>
      </div>
    </div>
  );
};