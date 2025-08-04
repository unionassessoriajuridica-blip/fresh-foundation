// components/GoogleLoginButton.tsx
import { signIn } from "next-auth/react";

export const GoogleLoginButton = () => {
  return (
    <button
      onClick={() => signIn("google")}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Entrar com Google
    </button>
  );
};
