import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  analiseUtilizavel,
  montarPromptAnalise,
  tipoExigeArquivo,
  tituloPadrao,
} from "@/modules/analises/analise";
import { montarContextoClinico } from "@/modules/analises/queries";
import { analiseClinica, gerarAnaliseSchema } from "@/modules/analises/schema";
import {
  ESFORCO_RACIOCINIO_COM_ANEXO,
  MAX_TOKENS_SAIDA_COM_ANEXO,
  MODELO_GROQ_PADRAO,
  groqConfigurado,
} from "@/modules/assistente/config";
import { extrairTextoPdf, validarArquivoPdf } from "@/modules/assistente/anexos";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { eq } from "drizzle-orm";

/**
 * Gera uma análise clínica (exame, biorressonância ou recomendação terapêutica).
 *
 * É rota, e não Server Action, pelo mesmo motivo de `app/api/assistente/anexos`: extrair PDF grande
 * e esperar o modelo passa do tempo padrão de uma action, e aqui dá pra declarar `maxDuration`.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

function ehArquivo(valor: FormDataEntryValue | null): valor is File {
  return typeof valor === "object" && valor !== null && "arrayBuffer" in valor && "size" in valor;
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

  if (!groqConfigurado()) {
    return NextResponse.json(
      { erro: "A análise por IA não está configurada (GROQ_API_KEY ausente)." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const entrada = gerarAnaliseSchema.safeParse({
    clienteId: formData.get("clienteId"),
    tipo: formData.get("tipo"),
    titulo: formData.get("titulo"),
  });

  if (!entrada.success) {
    return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  const { clienteId, tipo } = entrada.data;

  // `clienteId` vem do browser: revalida no banco antes de escrever no prontuário de alguém.
  const [clienteExiste] = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  if (!clienteExiste) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  const contexto = await montarContextoClinico(clienteId);

  if (!contexto) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  let material = "";
  let arquivo: {
    pathname: string;
    nome: string;
    contentType: string;
    tamanhoBytes: number;
  } | null = null;
  let textoExtraido: string | null = null;

  if (tipoExigeArquivo(tipo)) {
    const enviado = formData.get("arquivo");

    if (!ehArquivo(enviado)) {
      return NextResponse.json({ erro: "Envie o PDF para análise." }, { status: 400 });
    }

    const validacao = validarArquivoPdf({
      nome: enviado.name,
      tipo: enviado.type,
      tamanhoBytes: enviado.size,
    });

    if (!validacao.valido) {
      return NextResponse.json({ erro: validacao.erro }, { status: 400 });
    }

    const bytes = new Uint8Array(await enviado.arrayBuffer());

    let extraido;
    try {
      extraido = await extrairTextoPdf(bytes);
    } catch {
      return NextResponse.json(
        { erro: "Não foi possível ler o PDF. Ele pode estar protegido ou ser apenas imagem." },
        { status: 422 },
      );
    }

    if (!extraido.texto.trim()) {
      return NextResponse.json(
        {
          erro:
            "O PDF não tem texto selecionável (provavelmente é digitalizado). " +
            "Sem OCR não há o que analisar.",
        },
        { status: 422 },
      );
    }

    textoExtraido = extraido.texto;
    material = extraido.texto;

    // ⚠️ access:"public" porque o store do Vercel Blob está em modo público — ver
    // docs/context/06-lgpd-seguranca.md. O arquivo só é servido por rota autenticada.
    const blob = await put(`clientes/${clienteId}/analises/${validacao.nomeArquivo}`, enviado, {
      access: "public",
      addRandomSuffix: true,
      contentType: enviado.type || "application/pdf",
    });

    arquivo = {
      pathname: blob.pathname,
      nome: validacao.nomeArquivo,
      contentType: enviado.type || "application/pdf",
      tamanhoBytes: enviado.size,
    };
  } else {
    if (!contexto.temConteudo) {
      return NextResponse.json(
        {
          erro:
            "Ainda não há registro suficiente desta cliente para propor conduta. " +
            "Registre alergias, suplementos, dor ou sessões antes.",
        },
        { status: 422 },
      );
    }

    material = contexto.contexto;
  }

  const prompt = montarPromptAnalise({
    tipo,
    primeiroNomeCliente: contexto.primeiroNome,
    material,
    // Na recomendação o contexto JÁ é o material — não repetir.
    contextoClinico: tipoExigeArquivo(tipo) ? contexto.contexto : undefined,
  });

  let texto: string;

  try {
    const resultado = await generateText({
      model: groq(MODELO_GROQ_PADRAO),
      prompt,
      maxOutputTokens: MAX_TOKENS_SAIDA_COM_ANEXO,
      providerOptions: {
        groq: { reasoningEffort: ESFORCO_RACIOCINIO_COM_ANEXO, reasoningFormat: "hidden" },
      },
    });

    texto = resultado.text;
  } catch (error) {
    console.error("[analises] falha ao gerar análise", error);

    return NextResponse.json(
      { erro: "A IA não respondeu. Tente novamente em alguns instantes." },
      { status: 502 },
    );
  }

  // Análise vazia não pode virar registro clínico em branco no prontuário.
  if (!analiseUtilizavel(texto)) {
    return NextResponse.json(
      { erro: "A IA devolveu uma resposta vazia. Tente novamente." },
      { status: 502 },
    );
  }

  const [criada] = await db
    .insert(analiseClinica)
    .values({
      clienteId,
      tipo,
      titulo: entrada.data.titulo ?? tituloPadrao(tipo, arquivo?.nome),
      arquivoPathname: arquivo?.pathname ?? null,
      arquivoNome: arquivo?.nome ?? null,
      arquivoContentType: arquivo?.contentType ?? null,
      arquivoTamanhoBytes: arquivo?.tamanhoBytes ?? null,
      textoExtraido,
      analiseIa: texto.trim(),
      modeloIa: MODELO_GROQ_PADRAO,
      criadoPorId: usuarioAtual.id,
    })
    .returning({ id: analiseClinica.id });

  return NextResponse.json({ id: criada?.id, analise: texto.trim() }, { status: 201 });
}
