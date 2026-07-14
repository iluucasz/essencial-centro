import { count, eq } from "drizzle-orm";

import { db } from "@/db";

import { usuario } from "./schema";
import { gerarHashSenha, verificarSenha } from "./senha";
import type { CriarUsuarioInput } from "./schema";

export type UsuarioAutenticado = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "profissional" | "recepcao" | "cliente";
  clienteId: string | null;
  ativo: boolean;
};

export async function getUsuarioPorEmail(email: string) {
  const [registro] = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1);

  return registro ?? null;
}

export async function contarUsuarios() {
  const [resultado] = await db.select({ total: count() }).from(usuario);

  return resultado?.total ?? 0;
}

export async function possuiUsuarios() {
  return (await contarUsuarios()) > 0;
}

export async function criarUsuarioComSenha(input: CriarUsuarioInput) {
  const senhaHash = await gerarHashSenha(input.senha);
  const [registro] = await db
    .insert(usuario)
    .values({
      name: input.nome,
      email: input.email,
      role: input.role,
      clienteId: input.clienteId,
      senhaHash,
    })
    .returning({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role: usuario.role,
      clienteId: usuario.clienteId,
      ativo: usuario.ativo,
    });

  return registro;
}

export async function autenticarComSenha(
  email: string,
  senha: string,
): Promise<UsuarioAutenticado | null> {
  const registro = await getUsuarioPorEmail(email);

  if (!registro?.ativo) {
    return null;
  }

  const senhaValida = await verificarSenha(senha, registro.senhaHash);
  if (!senhaValida) {
    return null;
  }

  return {
    id: registro.id,
    name: registro.name,
    email: registro.email,
    image: registro.image,
    role: registro.role,
    clienteId: registro.clienteId,
    ativo: registro.ativo,
  };
}
