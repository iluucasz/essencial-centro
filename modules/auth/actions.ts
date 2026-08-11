"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { db } from "@/db";
import { violaConstraintUnica } from "@/lib/db-erros";

import { contarUsuarios, criarUsuarioComSenha } from "./credenciais";
import { podeAlternarAtivoDe, podeExcluirUsuario } from "./gestao";
import { autorizarPapel } from "./rbac";
import { gerarHashSenha, verificarSenha } from "./senha";
import {
  alterarSenhaSchema,
  atualizarMeuPerfilSchema,
  atualizarUsuarioSchema,
  credenciaisEntradaSchema,
  criarUsuarioSchema,
  definirPrimeiraSenhaSchema,
  usuario,
} from "./schema";

export type EstadoFormularioAuth = {
  status: "inicial" | "erro" | "sucesso";
  mensagem?: string;
  campos?: Record<string, string[] | undefined>;
};

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

function erroValidacao(
  campos: Record<string, string[] | undefined>,
  mensagem: string,
): EstadoFormularioAuth {
  return {
    status: "erro",
    mensagem,
    campos,
  };
}

function isEmailDuplicado(error: unknown) {
  return violaConstraintUnica(error, "usuario_email_unique");
}

export async function entrar(_: EstadoFormularioAuth = estadoInicial, formData: FormData) {
  const parsed = credenciaisEntradaSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados de entrada.");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      senha: parsed.data.senha,
      redirectTo: "/entrar/redirecionar",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "erro",
        mensagem: "E-mail ou senha inválidos.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  return estadoInicial;
}

export async function sair() {
  await signOut({ redirectTo: "/entrar" });
}

export async function criarPrimeiroAcesso(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
) {
  const totalUsuarios = await contarUsuarios();
  if (totalUsuarios > 0) {
    return {
      status: "erro",
      mensagem: "O primeiro acesso já foi configurado.",
    } satisfies EstadoFormularioAuth;
  }

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: "profissional",
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados do primeiro acesso.");
  }

  try {
    await criarUsuarioComSenha(parsed.data);
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/entrar");

  await signIn("credentials", {
    email: parsed.data.email,
    senha: parsed.data.senha,
    redirectTo: "/entrar/redirecionar",
  });

  return estadoInicial;
}

export async function criarUsuario(_: EstadoFormularioAuth = estadoInicial, formData: FormData) {
  const sessao = await auth();
  autorizarPapel(sessao, ["profissional"]);

  // Campo "Cliente vinculado" só existe no HTML quando role="cliente" (ver
  // FormularioUsuario) — nos outros casos formData.get() retorna null, não "" nem undefined,
  // e o schema não aceita null. Normaliza pra "" (que o schema já trata como "não informado").
  const clienteIdBruto = formData.get("clienteId");

  const parsed = criarUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    role: formData.get("role"),
    clienteId: typeof clienteIdBruto === "string" ? clienteIdBruto : "",
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados do usuário.");
  }

  try {
    await criarUsuarioComSenha(parsed.data);
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/painel/usuarios");

  return {
    status: "sucesso",
    mensagem: "Usuário criado com sucesso.",
  } satisfies EstadoFormularioAuth;
}

export async function atualizarUsuario(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
) {
  autorizarPapel(await auth(), ["profissional"]);

  // Mesmo caso do clienteId em criarUsuario — o campo só existe no HTML quando role="cliente".
  const clienteIdBruto = formData.get("clienteId");

  const parsed = atualizarUsuarioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    role: formData.get("role"),
    clienteId: typeof clienteIdBruto === "string" ? clienteIdBruto : "",
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados do usuário.");
  }

  try {
    const atualizados = await db
      .update(usuario)
      .set({
        name: parsed.data.nome,
        email: parsed.data.email,
        role: parsed.data.role,
        clienteId: parsed.data.clienteId ?? null,
        atualizadoEm: new Date(),
      })
      .where(eq(usuario.id, parsed.data.id))
      .returning({ id: usuario.id });

    if (atualizados.length === 0) {
      return {
        status: "erro",
        mensagem: "Usuário não encontrado.",
      } satisfies EstadoFormularioAuth;
    }
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/painel/usuarios");

  return {
    status: "sucesso",
    mensagem: "Usuário atualizado com sucesso.",
  } satisfies EstadoFormularioAuth;
}

/** Autoatendimento — a própria pessoa logada editando o nome/e-mail que ela vê no cabeçalho.
 * Diferente de `atualizarUsuario`: não recebe `id` do form (é sempre a sessão atual), sem
 * `role`/`clienteId` (isso é exclusivo da tela "Usuários"). */
export async function atualizarMeuPerfil(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = atualizarMeuPerfilSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise seus dados.");
  }

  try {
    await db
      .update(usuario)
      .set({
        name: parsed.data.nome,
        email: parsed.data.email,
        atualizadoEm: new Date(),
      })
      .where(eq(usuario.id, usuarioAtual.id));
  } catch (error) {
    if (isEmailDuplicado(error)) {
      return {
        status: "erro",
        mensagem: "Já existe um usuário com este e-mail.",
      } satisfies EstadoFormularioAuth;
    }

    throw error;
  }

  revalidatePath("/painel/configuracoes");

  return {
    status: "sucesso",
    mensagem: "Perfil atualizado com sucesso.",
  } satisfies EstadoFormularioAuth;
}

/** Fluxo deliberadamente separado de `atualizarMeuPerfil` — exige a senha atual antes de trocar
 * a credencial, mesmo já autenticada. */
export async function alterarSenha(_: EstadoFormularioAuth = estadoInicial, formData: FormData) {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = alterarSenhaSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarNovaSenha: formData.get("confirmarNovaSenha"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados da senha.");
  }

  const [registro] = await db
    .select({ senhaHash: usuario.senhaHash })
    .from(usuario)
    .where(eq(usuario.id, usuarioAtual.id))
    .limit(1);

  const senhaAtualValida = await verificarSenha(parsed.data.senhaAtual, registro?.senhaHash);

  if (!senhaAtualValida) {
    return erroValidacao(
      { senhaAtual: ["Senha atual incorreta."] },
      "Revise os dados da senha.",
    ) satisfies EstadoFormularioAuth;
  }

  const senhaHash = await gerarHashSenha(parsed.data.novaSenha);

  await db
    .update(usuario)
    .set({ senhaHash, atualizadoEm: new Date() })
    .where(eq(usuario.id, usuarioAtual.id));

  return {
    status: "sucesso",
    mensagem: "Senha alterada com sucesso.",
  } satisfies EstadoFormularioAuth;
}

/**
 * Stateful (via `useActionState`), e não mais um `<form action={fn}>` de retorno `void`: o formato
 * anterior falhava CALADO sempre que `podeAlternarAtivoDe` recusava (`return` sem mensagem) ou que
 * `autorizarPapel` lançava sem nenhum `error.tsx` no ar pra mostrar algo — o clique "não fazia nada"
 * e não havia como saber por quê. Agora todo caminho devolve `status`/`mensagem` pro modal exibir.
 */
export async function alternarAtivoUsuario(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional"]);

  const id = formData.get("id");
  const ativoAtual = formData.get("ativoAtual");

  if (typeof id !== "string" || typeof ativoAtual !== "string") {
    return { status: "erro", mensagem: "Usuário inválido." };
  }

  if (!podeAlternarAtivoDe(id, usuarioAtual.id)) {
    return { status: "erro", mensagem: "Você não pode alternar o próprio status." };
  }

  const atualizados = await db
    .update(usuario)
    .set({ ativo: ativoAtual !== "true", atualizadoEm: new Date() })
    .where(eq(usuario.id, id))
    .returning({ id: usuario.id });

  if (atualizados.length === 0) {
    return { status: "erro", mensagem: "Usuário não encontrado." };
  }

  revalidatePath("/painel/usuarios");

  return {
    status: "sucesso",
    mensagem: ativoAtual === "true" ? "Usuário desativado." : "Usuário ativado.",
  };
}

const excluirUsuarioSchema = z.object({
  id: z.string().uuid("Usuário inválido."),
  confirmarExclusao: z.literal("true", {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});

/**
 * Exclusão de VERDADE (não desativação) — só para contas `cliente` (login do portal). Uma conta
 * `profissional`/`recepcao` tem `criadoPorId`/`atualizadoPorId`/`profissionalId` apontando pra ela em
 * quase toda tabela clínica com `onDelete: "restrict"` — apagá-la ou apagaria o histórico de quem fez
 * o quê, ou (na prática) o Postgres recusa a query. Pra essas, desativar é a única ferramenta; ver
 * `podeExcluirUsuario`. Conta `cliente` não tem essa amarração: as tabelas que referenciam `usuario`
 * a partir do lado do cliente (`conta`, `sessao_auth`, `autenticador`, `notificacao`) já são
 * `onDelete: "cascade"`, e `usuario.clienteId` nem é FK — é só o vínculo com o cadastro clínico, que
 * a exclusão não toca.
 */
export async function excluirUsuario(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  autorizarPapel(await auth(), ["profissional"]);

  const parsed = excluirUsuarioSchema.safeParse({
    id: formData.get("id"),
    confirmarExclusao: formData.get("confirmarExclusao"),
  });

  if (!parsed.success) {
    return erroValidacao(
      parsed.error.flatten().fieldErrors,
      "Confirme a exclusão antes de continuar.",
    );
  }

  const [registro] = await db
    .select({ role: usuario.role })
    .from(usuario)
    .where(eq(usuario.id, parsed.data.id))
    .limit(1);

  if (!registro) {
    return { status: "erro", mensagem: "Usuário não encontrado." };
  }

  if (!podeExcluirUsuario(registro.role)) {
    return {
      status: "erro",
      mensagem: "Contas de profissional/recepção não podem ser excluídas — desative em vez disso.",
    };
  }

  await db.delete(usuario).where(eq(usuario.id, parsed.data.id));

  revalidatePath("/painel/usuarios");

  return { status: "sucesso", mensagem: "Acesso ao portal excluído." };
}

/**
 * Primeira senha de quem entrou com a provisória. Não exige a senha atual (ver
 * `definirPrimeiraSenhaSchema`) e serve a QUALQUER papel — a clínica também pode criar uma conta de
 * recepção com senha gerada. Só funciona enquanto `deveTrocarSenha` está de pé: fora disso a troca é
 * pelo fluxo normal, que pede a senha vigente.
 */
export async function definirPrimeiraSenha(
  _: EstadoFormularioAuth = estadoInicial,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const sessao = await auth();
  const usuarioAtual = sessao?.user;

  if (!usuarioAtual?.id) {
    return { status: "erro", mensagem: "Entre novamente para definir sua senha." };
  }

  const parsed = definirPrimeiraSenhaSchema.safeParse({
    novaSenha: formData.get("novaSenha"),
    confirmarNovaSenha: formData.get("confirmarNovaSenha"),
  });

  if (!parsed.success) {
    return erroValidacao(parsed.error.flatten().fieldErrors, "Revise os dados da senha.");
  }

  const senhaHash = await gerarHashSenha(parsed.data.novaSenha);

  /*
    WHERE amarrado a `deveTrocarSenha`: sem isso esta action seria uma troca de senha sem senha atual
    para qualquer usuário logado — bastaria chamá-la direto. A flag é a autorização do fluxo.
  */
  const atualizados = await db
    .update(usuario)
    .set({ senhaHash, deveTrocarSenha: false, atualizadoEm: new Date() })
    .where(and(eq(usuario.id, usuarioAtual.id), eq(usuario.deveTrocarSenha, true)))
    .returning({ id: usuario.id });

  if (atualizados.length === 0) {
    return {
      status: "erro",
      mensagem: "Sua senha já foi definida. Use 'Alterar senha' no perfil.",
    };
  }

  return { status: "sucesso", mensagem: "Senha definida com sucesso." };
}
