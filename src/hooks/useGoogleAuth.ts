import { useState, useEffect } from "react";
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

export const useGoogleAuth = (config: GoogleAuthConfig) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGoogleAPI();
  }, []);

  const loadGoogleAPI = async () => {
    if (typeof window !== "undefined" && !window.gapi) {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = initializeGapi;
      document.body.appendChild(script);
    } else if (window.gapi) {
      initializeGapi();
    }
  };

  const initializeGapi = () => {
    const client_id = "90141190775-qqgb05aq59fmqegieiguk4gq0u0140sp.apps.googleusercontent.com";

    console.log("Google Client ID useGoogleAuth:", client_id);

    window.gapi.load("auth2", () => {
      window.gapi.auth2
        .init({
          client_id,
          scope: "profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly",
        })
        .then(() => {
          const authInstance = window.gapi.auth2.getAuthInstance();
          const isSignedIn = authInstance.isSignedIn.get();

          if (isSignedIn) {
            const user = authInstance.currentUser.get();
            handleAuthSuccess(user);
          }
        });
    });
  };

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
  };
};

// Declaração de tipos para window.gapi
declare global {
  interface Window {
    gapi: any;
  }
}
