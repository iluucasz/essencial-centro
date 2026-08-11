import { NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { analiseUtilizavel, montarPromptRefinamento } from "@/modules/analises/analise";
import { analiseClinica, refinarAnaliseSchema } from "@/modules/analises/schema";
import { montarContextoClinico } from "@/modules/analises/queries";
import {
  ESFORCO_RACIOCINIO_COM_ANEXO,
  MAX_TOKENS_SAIDA_COM_ANEXO,
  MODELO_GROQ_PADRAO,
  groqConfigurado,
} from "@/modules/assistente/config";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";

/** Rota, e não Server Action, pelo mesmo motivo da geração: esperar o modelo passa do tempo padrão. */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    autorizarPapel(await auth(), ["profissional"]);
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

  const corpo = await request.json().catch(() => null);
  const entrada = refinarAnaliseSchema.safeParse(corpo);

  if (!entrada.success) {
    return NextResponse.json(
      { erro: entrada.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  // WHERE amarrado ao cliente: id de outra cliente não encontra linha.
  const [registro] = await db
    .select({
      tipo: analiseClinica.tipo,
      analiseIa: analiseClinica.analiseIa,
      analiseIaOriginal: analiseClinica.analiseIaOriginal,
      refinamentos: analiseClinica.refinamentos,
      textoExtraido: analiseClinica.textoExtraido,
    })
    .from(analiseClinica)
    .where(and(eq(analiseClinica.id, id), eq(analiseClinica.clienteId, entrada.data.clienteId)))
    .limit(1);

  if (!registro) {
    return NextResponse.json({ erro: "Análise não encontrada." }, { status: 404 });
  }

  /**
   * Material de origem: o PDF extraído quando existe; na recomendação, o prontuário atual. Vai junto
   * porque sem ele o modelo cumpriria a instrução inventando o que não tem como lembrar.
   */
  let material = registro.textoExtraido;

  if (!material && registro.tipo === "recomendacao") {
    const contexto = await montarContextoClinico(entrada.data.clienteId);
    material = contexto?.contexto ?? null;
  }

  let texto: string;

  try {
    const resultado = await generateText({
      model: groq(MODELO_GROQ_PADRAO),
      prompt: montarPromptRefinamento({
        tipo: registro.tipo,
        analiseAtual: registro.analiseIa,
        instrucao: entrada.data.instrucao,
        material,
      }),
      maxOutputTokens: MAX_TOKENS_SAIDA_COM_ANEXO,
      providerOptions: {
        groq: { reasoningEffort: ESFORCO_RACIOCINIO_COM_ANEXO, reasoningFormat: "hidden" },
      },
    });

    texto = resultado.text;
  } catch (error) {
    console.error("[analises] falha ao refinar análise", error);

    return NextResponse.json(
      { erro: "A IA não respondeu. Tente novamente em alguns instantes." },
      { status: 502 },
    );
  }

  if (!analiseUtilizavel(texto)) {
    return NextResponse.json(
      { erro: "A IA devolveu uma resposta vazia. O texto anterior foi mantido." },
      { status: 502 },
    );
  }

  await db
    .update(analiseClinica)
    .set({
      analiseIa: texto.trim(),
      // Só na primeira rodada: preserva de onde se partiu, sem sobrescrever nas seguintes.
      analiseIaOriginal: registro.analiseIaOriginal ?? registro.analiseIa,
      refinamentos: [
        ...registro.refinamentos,
        { instrucao: entrada.data.instrucao, em: new Date().toISOString() },
      ],
      /**
       * ⚠️ Derruba a revisão. Se a profissional já tinha marcado "revisada" e agora a IA reescreveu o
       * texto, a revisão era de OUTRO conteúdo — manter o selo faria um texto não conferido passar
       * por conferido no prontuário.
       */
      revisadoPorId: null,
      revisadoEm: null,
      atualizadoEm: new Date(),
    })
    .where(and(eq(analiseClinica.id, id), eq(analiseClinica.clienteId, entrada.data.clienteId)));

  return NextResponse.json({ analise: texto.trim() });
}
