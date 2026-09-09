import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db";
import { autenticarComSenha } from "@/modules/auth/credenciais";
import { isFuncaoUsuario, isPapelUsuario } from "@/modules/auth/rbac";
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
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clienteId = user.clienteId;
        token.ativo = user.ativo;
        token.funcao = user.funcao;
      }

      /**
       * Único uso hoje: `SeletorFuncaoTeste` chama `update({ funcao })` depois de gravar a nova
       * função no banco, pra refletir na sessão sem exigir logout/login (JWT normalmente só lê o
       * `user` acima, na hora do login). Ver `alternarFuncaoTeste` em `modules/auth/actions.ts`.
       */
      if (trigger === "update" && session && typeof session === "object" && "funcao" in session) {
        const novaFuncao = (session as { funcao?: unknown }).funcao;
        if (isFuncaoUsuario(novaFuncao) || novaFuncao === null) {
          token.funcao = novaFuncao;
        }
      }

      return token;
    },
    session({ session, token }) {
      const tokenId = typeof token.id === "string" ? token.id : null;
      const clienteId = typeof token.clienteId === "string" ? token.clienteId : null;
      const ativo = typeof token.ativo === "boolean" ? token.ativo : true;
      const funcao = isFuncaoUsuario(token.funcao) ? token.funcao : null;

      if (session.user && tokenId && isPapelUsuario(token.role)) {
        session.user.id = tokenId;
        session.user.role = token.role;
        session.user.clienteId = clienteId;
        session.user.ativo = ativo;
        session.user.funcao = funcao;
      }

      return session;
    },
  },
});
