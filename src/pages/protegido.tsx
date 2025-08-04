// pages/protegido.tsx
import { getSession } from "next-auth/react";

export default function Protegido() {
  return <p>Você está autenticado!</p>;
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
}
