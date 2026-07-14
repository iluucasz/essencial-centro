import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db";
import { autenticarComSenha } from "@/modules/auth/credenciais";
import { isPapelUsuario } from "@/modules/auth/rbac";
import {
  autenticador,
  conta,
  credenciaisEntradaSchema,
  sessaoAuth,
  tokenVerificacao,
  usuario,
} from "@/modules/auth/schema";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: usuario,
    accountsTable: conta,
    sessionsTable: sessaoAuth,
    verificationTokensTable: tokenVerificacao,
    authenticatorsTable: autenticador,
  }),
  pages: {
    signIn: "/entrar",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credenciaisEntradaSchema.safeParse(credentials);
        if (!parsed.success) return null;

        return autenticarComSenha(parsed.data.email, parsed.data.senha);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clienteId = user.clienteId;
        token.ativo = user.ativo;
      }

      return token;
    },
    session({ session, token }) {
      const tokenId = typeof token.id === "string" ? token.id : null;
      const clienteId = typeof token.clienteId === "string" ? token.clienteId : null;
      const ativo = typeof token.ativo === "boolean" ? token.ativo : true;

      if (session.user && tokenId && isPapelUsuario(token.role)) {
        session.user.id = tokenId;
        session.user.role = token.role;
        session.user.clienteId = clienteId;
        session.user.ativo = ativo;
      }

      return session;
    },
  },
});
