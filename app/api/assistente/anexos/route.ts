import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  extrairTextoPdf,
  podeUsarAnexosAssistente,
  validarArquivoPdf,
} from "@/modules/assistente/anexos";
import { anexoAssistente } from "@/modules/assistente/schema";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";

export const runtime = "nodejs";
export const maxDuration = 60;

function isArquivoFormData(valor: FormDataEntryValue | null): valor is File {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "arrayBuffer" in valor &&
    "name" in valor &&
    "size" in valor &&
    "type" in valor
  );
}

export async function POST(request: Request) {
  let usuarioAtual;

  try {
    usuarioAtual = autorizarPapel(await auth(), ["profissional"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      return new NextResponse(error.message, { status: error.status });
    }

    throw error;
  }

  if (!podeUsarAnexosAssistente(usuarioAtual.role)) {
    return new NextResponse("Acesso não autorizado.", { status: 403 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!isArquivoFormData(arquivo)) {
    return NextResponse.json({ erro: "Envie um PDF no campo arquivo." }, { status: 400 });
  }

  const validacao = validarArquivoPdf({
    nome: arquivo.name,
    tamanhoBytes: arquivo.size,
    tipo: arquivo.type,
  });

  if (!validacao.valido) {
    return NextResponse.json({ erro: validacao.erro }, { status: 400 });
  }

  let extraido;

  try {
    extraido = await extrairTextoPdf(new Uint8Array(await arquivo.arrayBuffer()));
  } catch (error) {
    console.error("Erro ao extrair texto do PDF do assistente:", error);

    return NextResponse.json({ erro: "Não foi possível ler o texto desse PDF." }, { status: 422 });
  }

  if (!extraido.texto) {
    return NextResponse.json({ erro: "Não encontrei texto legível nesse PDF." }, { status: 422 });
  }

  const [anexo] = await db
    .insert(anexoAssistente)
    .values({
      contentType: arquivo.type || "application/pdf",
      nomeArquivo: validacao.nomeArquivo,
      profissionalId: usuarioAtual.id,
      tamanhoBytes: arquivo.size,
      textoExtraido: extraido.texto,
      totalCaracteres: extraido.totalCaracteres,
      totalPaginas: extraido.totalPaginas,
    })
    .returning({
      id: anexoAssistente.id,
      nomeArquivo: anexoAssistente.nomeArquivo,
      totalCaracteres: anexoAssistente.totalCaracteres,
      totalPaginas: anexoAssistente.totalPaginas,
    });

  if (!anexo) {
    return NextResponse.json({ erro: "Não foi possível salvar o anexo." }, { status: 500 });
  }

  return NextResponse.json({ anexo });
}
