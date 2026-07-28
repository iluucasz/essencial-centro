import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  extrairTextoPdf,
  podeUsarAnexosAssistente,
  validarArquivoPdf,
} from "@/modules/assistente/anexos";
import { encontrarClienteDoDocumento } from "@/modules/assistente/identificacao-cliente";
import { anexoAssistente } from "@/modules/assistente/schema";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { listarClientes } from "@/modules/clientes/queries";

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

  // ⚠️ access:"public" porque o store do Vercel Blob configurado está em modo público — não é um
  // blob verdadeiramente privado. Mesmo aviso de modules/fotos; ver docs/context/06-lgpd-seguranca.md.
  let pathname: string | null = null;

  try {
    const blob = await put(`assistente/${usuarioAtual.id}/${validacao.nomeArquivo}`, arquivo, {
      access: "public",
      addRandomSuffix: true,
      contentType: arquivo.type || "application/pdf",
    });

    pathname = blob.pathname;
  } catch (error) {
    // Guardar o binário é o que permite arquivar o anexo no prontuário depois; se falhar, o resumo
    // ainda funciona, então seguimos sem o arquivo em vez de derrubar o upload inteiro.
    console.error("Erro ao guardar o PDF do assistente no Blob:", error);
  }

  const [anexo] = await db
    .insert(anexoAssistente)
    .values({
      contentType: arquivo.type || "application/pdf",
      nomeArquivo: validacao.nomeArquivo,
      pathname,
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

  // Palpite de quem é o dono do documento — a profissional confirma antes de virar registro.
  const clientes = await listarClientes();
  const correspondencia = encontrarClienteDoDocumento({
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome })),
    nomeArquivo: anexo.nomeArquivo,
    texto: extraido.texto,
  });

  return NextResponse.json({
    anexo,
    clienteSugerido: correspondencia?.ambigua ? null : (correspondencia?.cliente ?? null),
    podeArquivar: pathname !== null,
  });
}
