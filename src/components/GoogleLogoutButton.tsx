import { signOut } from "next-auth/react";

export const GoogleLogoutButton = () => (
  <button
    onClick={() => signOut()}
    className="bg-red-600 text-white px-4 py-2 rounded"
  >
    Sair
  </button>
);
