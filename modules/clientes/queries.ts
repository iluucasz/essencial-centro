import { eq, ilike, or, desc } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { filtrarClienteParaUsuario } from "./acesso";
import { cliente } from "./schema";

export async function listarClientes(busca?: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const termo = busca?.trim();

  return db
    .select({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      dataNascimento: cliente.dataNascimento,
      endereco: cliente.endereco,
      contatoEmergenciaNome: cliente.contatoEmergenciaNome,
      contatoEmergenciaTelefone: cliente.contatoEmergenciaTelefone,
      profissao: cliente.profissao,
      objetivoTratamento: cliente.objetivoTratamento,
      alergias: cliente.alergias,
      medicamentos: cliente.medicamentos,
      condicoesSaude: cliente.condicoesSaude,
      cirurgias: cliente.cirurgias,
      contraindicacoes: cliente.contraindicacoes,
      consentimentoDados: cliente.consentimentoDados,
      consentimentoImagem: cliente.consentimentoImagem,
      observacoesInternas: cliente.observacoesInternas,
      criadoEm: cliente.criadoEm,
    })
    .from(cliente)
    .where(
      termo ? or(ilike(cliente.nome, `%${termo}%`), ilike(cliente.email, `%${termo}%`)) : undefined,
    )
    .orderBy(desc(cliente.criadoEm));
}

export async function getCliente(id: string) {
  const sessao = await auth();
  const usuario = autorizarPapel(sessao, ["profissional", "recepcao", "cliente"]);
  const [registro] = await db.select().from(cliente).where(eq(cliente.id, id)).limit(1);

  if (!registro) {
    return null;
  }

  return filtrarClienteParaUsuario(registro, usuario);
}

export async function getMeuCliente() {
  const sessao = await auth();
  const usuario = autorizarPapel(sessao, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessao, usuario.clienteId);

  return getCliente(usuario.clienteId);
}
