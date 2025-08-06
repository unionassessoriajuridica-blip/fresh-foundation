import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Swal from 'sweetalert2';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Mostrar mensagem de confirmação
      const result = await Swal.fire({
        title: 'Encerrar sessão?',
        text: 'Você está prestes a sair do sistema.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, sair',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Mostrar loader durante o logout
        Swal.fire({
          title: 'Encerrando o sistema...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Fazer logout no Supabase
        await supabase.auth.signOut();

        // Feedback visual de sucesso
        await Swal.fire({
          icon: 'success',
          title: 'Sessão encerrada!',
          text: 'Você foi desconectado com segurança.',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        });

        // Redirecionar usando variável de ambiente
        window.location.href = import.meta.env.VITE_APP_URL || '/';
        
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Ocorreu um problema ao encerrar a sessão'
      });
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!session
  };
};