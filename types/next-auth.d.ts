import type { DefaultSession } from "next-auth";

import type { FuncaoUsuario, PapelUsuario } from "@/modules/auth/rbac";

declare module "next-auth" {
  interface User {
    role?: PapelUsuario;
    clienteId?: string | null;
    ativo?: boolean;
    funcao?: FuncaoUsuario | null;
  }

  interface Session {
    user?: {
      id: string;
      role: PapelUsuario;
      clienteId?: string | null;
      ativo: boolean;
      funcao?: FuncaoUsuario | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: PapelUsuario;
    clienteId?: string | null;
    ativo?: boolean;
    funcao?: FuncaoUsuario | null;
  }
}
