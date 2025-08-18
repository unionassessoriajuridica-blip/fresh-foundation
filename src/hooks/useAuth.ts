import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription }, error } = supabase.auth.onAuthStateChange((event, session) => {
      if (error) {
        console.error("Erro na sessão:", error);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const result = await Swal.fire({
        title: "Encerrar sessão?",
        text: "Você está prestes a sair do sistema.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Encerrando o sistema...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await supabase.auth.signOut();

        await Swal.fire({
          icon: "success",
          title: "Sessão encerrada!",
          text: "Você foi desconectado com segurança.",
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Ocorreu um problema ao encerrar a sessão",
      });
    }
  };

  return { user, session, loading, signOut, isAuthenticated: !!session };
};
