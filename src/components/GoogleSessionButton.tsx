import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

export const UserInfo = () => {
  const { data } = useSession();
  const session = data as Session;

  if (!session) return <p>Você não está logado</p>;

  return (
    <div>
      <p>Bem-vindo, {session.user?.name}</p>
      <p>Email: {session.user?.email}</p>
      
    </div>
  );
};
