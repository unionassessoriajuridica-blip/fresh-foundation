// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Aqui você pode fazer validações ou salvar no banco, se quiser
      return true;
    },
    async session({ session, token }) {
      // Modificar dados da sessão, se necessário
      return session;
    },
  },
});
