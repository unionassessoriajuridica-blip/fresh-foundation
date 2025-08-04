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

  const SCRIPT_ID = "google-api-script";

  useEffect(() => {
    loadGoogleAPI();
  }, []);

  const loadGoogleAPI = async (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window object not available"));
        return;
      }

      // Verifica se o script já foi carregado
      if (window.gapi) {
        resolve(true);
        return;
      }

      // Verifica se o script já está sendo carregado
      if (document.getElementById(SCRIPT_ID)) {
        const checkLoaded = () => {
          if (window.gapi) {
            resolve(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load("auth2:client", {
          callback: () => resolve(true),
          onerror: () => reject(new Error("Failed to load auth2 module")),
        });
      };
      script.onerror = () =>
        reject(new Error("Failed to load Google API script"));
      document.body.appendChild(script);
    });
  };

  const initializeGapi = () => {
    const client_id = config.clientId; // usa o clientId que veio da prop

    if (!window.gapi.auth2) {
      window.gapi.load("auth2", {
        callback: () => {
          // SOMENTE INICIALIZA SE AINDA NÃO HOUVER UMA INSTÂNCIA
          if (!window.gapi.auth2.getAuthInstance()) {
            window.gapi.auth2
              .init({
                client_id,
                scope: config.scopes.join(" "),
              })
              .then(() => {
                const authInstance = window.gapi.auth2.getAuthInstance();
                const isSignedIn = authInstance.isSignedIn.get();

                if (isSignedIn) {
                  const user = authInstance.currentUser.get();
                  handleAuthSuccess(user);
                }
              });
          } else {
            // Já está inicializado
            const authInstance = window.gapi.auth2.getAuthInstance();
            const isSignedIn = authInstance.isSignedIn.get();
            if (isSignedIn) {
              const user = authInstance.currentUser.get();
              handleAuthSuccess(user);
            }
          }
        },
        onerror: () => {
          toast({
            title: "Erro ao carregar Google API",
            description: "Falha ao inicializar autenticação com Google",
            variant: "destructive",
          });
        },
      });
    }
  };

  const signIn = async () => {
    setIsLoading(true);
    try {
      await loadGoogleAPI();

      if (!window.gapi?.auth2) {
        throw new Error("Google API not loaded");
      }

      // Inicializa o auth2 se não estiver inicializado
      if (!window.gapi.auth2.getAuthInstance()) {
        await window.gapi.auth2.init({
          client_id: config.clientId,
          scope: config.scopes.join(" "),
        });
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn({
        prompt: "select_account",
      });

      handleAuthSuccess(user);

      toast({
        title: "Conectado com sucesso!",
        description: "Sua conta Google foi conectada.",
      });

      return true;
    } catch (error) {
      console.error("Erro na autenticação:", error);
      toast({
        title: "Erro na autenticação",
        description:
          error.message || "Não foi possível conectar com sua conta Google.",
        variant: "destructive",
      });
      return false;
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

declare global {
  interface Window {
    gapi: any;
  }
}
