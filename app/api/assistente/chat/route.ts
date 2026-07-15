import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { salvarMensagemAssistente } from "@/modules/assistente/actions";
import {
  LIMITE_MENSAGENS_CONTEXTO,
  LIMITE_PASSOS_FERRAMENTA,
  MODELO_GROQ_PADRAO,
  groqConfigurado,
} from "@/modules/assistente/config";
import { montarJanelaContexto } from "@/modules/assistente/contexto";
import { montarPromptSistema } from "@/modules/assistente/prompt";
import { enviarMensagemAssistenteSchema } from "@/modules/assistente/schema";
import { gerarSugestoesAssistente } from "@/modules/assistente/sugestoes";
import { ferramentasAssistente } from "@/modules/assistente/tools";

export const maxDuration = 30;

function extrairTextoDaMensagem(mensagem: { parts: unknown[] }) {
  return mensagem.parts
    .filter(
      (parte): parte is { type: "text"; text: string } =>
        typeof parte === "object" &&
        parte !== null &&
        (parte as { type?: unknown }).type === "text",
    )
    .map((parte) => parte.text)
    .join("\n")
    .trim();
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
      { erro: "Assistente de IA não configurado (GROQ_API_KEY ausente)." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = enviarMensagemAssistenteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const { messages } = parsed.data;
  const ultimaMensagem = messages[messages.length - 1];
  const textoUsuario = extrairTextoDaMensagem(ultimaMensagem);

  if (textoUsuario) {
    await salvarMensagemAssistente("usuario", textoUsuario);
  }

  const janela = montarJanelaContexto(messages, LIMITE_MENSAGENS_CONTEXTO);
  const mensagensModelo = await convertToModelMessages(janela as unknown as UIMessage[]);
  const nomeProfissional = usuarioAtual.name ?? "profissional";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const resultado = streamText({
        model: groq(MODELO_GROQ_PADRAO),
        instructions: montarPromptSistema({ dataAtual: new Date(), nomeProfissional }),
        messages: mensagensModelo,
        tools: ferramentasAssistente,
        stopWhen: stepCountIs(LIMITE_PASSOS_FERRAMENTA),
      });

      writer.merge(resultado.toUIMessageStream());

      const textoResposta = await resultado.text;

      if (!textoResposta) return;

      await salvarMensagemAssistente("assistente", textoResposta);

      const sugestoes = await gerarSugestoesAssistente({
        pergunta: textoUsuario,
        resposta: textoResposta,
      });

      if (sugestoes.length > 0) {
        writer.write({ type: "data-sugestoes", data: { sugestoes } });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
