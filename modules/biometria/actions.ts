"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";

import { CODIGO_CADASTRO_TTL_MINUTOS, gerarCodigoNumerico } from "./cadastro";
import { biometriaCliente, codigoCadastroBiometria, gerarCodigoCadastroSchema } from "./schema";

export type EstadoCodigoCadastro =
  | { status: "inicial" }
  | { status: "erro"; mensagem: string }
  | { status: "sucesso"; codigo: string; expiraEm: string };

const estadoInicial: EstadoCodigoCadastro = { status: "inicial" };

export async function gerarCodigoCadastroBiometria(
  _: EstadoCodigoCadastro = estadoInicial,
  formData: FormData,
): Promise<EstadoCodigoCadastro> {
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const parsed = gerarCodigoCadastroSchema.safeParse({
    clienteId: formData.get("clienteId"),
    dedo: formData.get("dedo"),
  });

  if (!parsed.success) {
    return { status: "erro", mensagem: "Selecione o dedo." };
  }

  const [registro] = await db
    .select({ consentimentoBiometria: cliente.consentimentoBiometria })
    .from(cliente)
    .where(eq(cliente.id, parsed.data.clienteId))
    .limit(1);

  if (!registro?.consentimentoBiometria) {
    return {
      status: "erro",
      mensagem: "Registre o consentimento de biometria do cliente antes de gerar um código.",
    };
  }

  // Supera qualquer código ainda válido pro mesmo cliente+dedo.
  await db
    .update(codigoCadastroBiometria)
    .set({ expiraEm: new Date() })
    .where(
      and(
        eq(codigoCadastroBiometria.clienteId, parsed.data.clienteId),
        eq(codigoCadastroBiometria.dedo, parsed.data.dedo),
        isNull(codigoCadastroBiometria.consumidoEm),
      ),
    );

  let codigo = gerarCodigoNumerico();

  for (let tentativas = 0; tentativas < 5; tentativas++) {
    const [colisao] = await db
      .select({ id: codigoCadastroBiometria.id })
      .from(codigoCadastroBiometria)
      .where(
        and(
          eq(codigoCadastroBiometria.codigo, codigo),
          isNull(codigoCadastroBiometria.consumidoEm),
          gt(codigoCadastroBiometria.expiraEm, new Date()),
        ),
      )
      .limit(1);

    if (!colisao) break;
    codigo = gerarCodigoNumerico();
  }

  const expiraEm = new Date(Date.now() + CODIGO_CADASTRO_TTL_MINUTOS * 60_000);

  await db.insert(codigoCadastroBiometria).values({
    clienteId: parsed.data.clienteId,
    dedo: parsed.data.dedo,
    codigo,
    expiraEm,
    criadoPorId: usuarioAtual.id,
  });

  return { status: "sucesso", codigo, expiraEm: expiraEm.toISOString() };
}

export async function desativarBiometria(formData: FormData) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const id = formData.get("id");
  const clienteId = formData.get("clienteId");
  if (typeof id !== "string" || typeof clienteId !== "string") return;

  await db
    .update(biometriaCliente)
    .set({ ativo: false })
    .where(and(eq(biometriaCliente.id, id), eq(biometriaCliente.ativo, true)));

  revalidatePath(`/painel/clientes/${clienteId}`);
}
