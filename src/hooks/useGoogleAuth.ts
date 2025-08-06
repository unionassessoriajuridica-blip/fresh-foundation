import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface GoogleUserInfo {
  name: string;
  email: string;
  picture?: string;
  id: string;
}

interface GoogleAuthConfig {
  clientId: string;
  scopes: string[];
}

interface GoogleAuthReturn {
  isAuthenticated: boolean;
  userInfo: GoogleUserInfo | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  clientId: string;
}

export const useGoogleAuth = (config: GoogleAuthConfig) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAuthSuccess = (user: any) => {
    const profile = user.getBasicProfile();
    const authResponse = user.getAuthResponse();

    setUserInfo({
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl(),
    });

    setAccessToken(authResponse.access_token);
    setIsAuthenticated(true);
  };

  const loadGoogleAPI = useCallback(async () => {
    const initializeGapi = () => {
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log("Valor de VITE_GOOGLE_CLIENT_ID:", client_id);
      const scope = [
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");

      window.gapi.load("auth2:client", () => {
        window.gapi.client
          .init({
            client_id,
            scope,
          })
          .then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();
            const isSignedIn = authInstance.isSignedIn.get();
            if (isSignedIn) {
              const user = authInstance.currentUser.get();
              handleAuthSuccess(user);
            }
          })
          .catch((error: any) => {
            console.error("Erro na inicialização do gapi.client:", error);
            toast({
              title: "Erro na inicialização",
              description: "Falha ao inicializar a API do Google.",
              variant: "destructive",
            });
          });
      });
    };

    if (typeof window !== "undefined" && !window.gapi) {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.onload = initializeGapi;
      script.onerror = () => {
        console.error("Falha ao carregar o script do Google API");
        toast({
          title: "Erro",
          description: "Não foi possível carregar a API do Google.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    } else if (window.gapi) {
      initializeGapi();
    }
  }, [toast]);

  useEffect(() => {
    loadGoogleAPI();
  }, [loadGoogleAPI]);

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (!window.gapi?.auth2) {
        throw new Error("Google API não carregada");
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      handleAuthSuccess(user);

      toast({
        title: "Conectado com sucesso!",
        description: "Sua conta Google foi conectada.",
      });
    } catch (error) {
      console.error("Erro na autenticação:", error);
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível conectar com sua conta Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
      }

      setIsAuthenticated(false);
      setUserInfo(null);
      setAccessToken(null);

      toast({
        title: "Desconectado",
        description: "Sua conta Google foi desconectada.",
      });
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    }
  };

  const getAccessToken = () => {
    if (window.gapi?.auth2) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    }
    return accessToken;
  };

  return {
    isAuthenticated,
    userInfo,
    isLoading,
    signIn,
    signOut,
    getAccessToken,
    setAccessToken,
    setIsAuthenticated,
    clientId: config.clientId,
  } satisfies GoogleAuthReturn;
};

declare global {
  interface Window {
    gapi: any;
  }
}
