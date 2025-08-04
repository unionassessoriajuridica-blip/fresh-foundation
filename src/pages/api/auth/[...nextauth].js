// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: '90141190775-qqgb05aq59fmqegieiguk4gq0u0140sp.apps.googleusercontent.com',
      clientSecret: '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',
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
