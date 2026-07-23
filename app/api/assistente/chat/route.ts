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
import { agoraBrasilia } from "@/lib/utils";
import { montarContextoAnexoAssistente } from "@/modules/assistente/anexos";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";
import { listarClientes } from "@/modules/clientes/queries";
import { salvarMensagemAssistente } from "@/modules/assistente/actions";
import {
  ESFORCO_RACIOCINIO_COM_ANEXO,
  LIMITE_MENSAGENS_CONTEXTO_COM_ANEXO,
  LIMITE_MENSAGENS_CONTEXTO,
  LIMITE_PASSOS_FERRAMENTA_COM_ANEXO,
  LIMITE_PASSOS_FERRAMENTA,
  MAX_TOKENS_SAIDA_COM_ANEXO,
  MODELO_GROQ_PADRAO,
  groqConfigurado,
} from "@/modules/assistente/config";
import { montarJanelaContexto } from "@/modules/assistente/contexto";
import {
  deveGerarDocumentoResumoPdf,
  montarDocumentoResumoPdf,
} from "@/modules/assistente/documentos-resumo";
import { montarPromptSistema } from "@/modules/assistente/prompt";
import { obterAnexoAssistenteDoProfissional } from "@/modules/assistente/queries";
import { enviarMensagemAssistenteSchema } from "@/modules/assistente/schema";
import { gerarSugestoesAssistente } from "@/modules/assistente/sugestoes";
import { ferramentasAssistenteParaContexto } from "@/modules/assistente/tools";

export const maxDuration = 60;

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

  const { anexoId, messages } = parsed.data;
  const ultimaMensagem = messages[messages.length - 1];
  const textoUsuario = extrairTextoDaMensagem(ultimaMensagem);
  const anexoAtivo = anexoId
    ? await obterAnexoAssistenteDoProfissional(anexoId, usuarioAtual.id)
    : null;

  if (anexoId && !anexoAtivo) {
    return NextResponse.json({ erro: "Anexo não encontrado." }, { status: 404 });
  }

  if (textoUsuario) {
    await salvarMensagemAssistente(
      "usuario",
      anexoAtivo ? `${textoUsuario}\n\n[PDF anexado: ${anexoAtivo.nomeArquivo}]` : textoUsuario,
    );
  }

  const contextoAnexo = anexoAtivo
    ? montarContextoAnexoAssistente({ anexo: anexoAtivo, pergunta: textoUsuario })
    : undefined;
  const limiteMensagens = anexoAtivo
    ? LIMITE_MENSAGENS_CONTEXTO_COM_ANEXO
    : LIMITE_MENSAGENS_CONTEXTO;
  const limitePassos = anexoAtivo ? LIMITE_PASSOS_FERRAMENTA_COM_ANEXO : LIMITE_PASSOS_FERRAMENTA;
  const janela = montarJanelaContexto(messages, limiteMensagens);
  const mensagensModelo = await convertToModelMessages(janela as unknown as UIMessage[]);
  const nomeProfissional = usuarioAtual.name ?? "profissional";

  const stream = createUIMessageStream({
    onError: (erro) => {
      console.error("[assistente] erro no stream do chat:", erro);

      return "Não foi possível gerar a resposta agora. Tente novamente.";
    },
    execute: async ({ writer }) => {
      const resultado = streamText({
        model: groq(MODELO_GROQ_PADRAO),
        instructions: montarPromptSistema({
          contextoAnexo,
          dataAtual: agoraBrasilia(),
          nomeProfissional,
        }),
        messages: mensagensModelo,
        providerOptions: anexoAtivo
          ? { groq: { reasoningEffort: ESFORCO_RACIOCINIO_COM_ANEXO, reasoningFormat: "hidden" } }
          : undefined,
        maxOutputTokens: anexoAtivo ? MAX_TOKENS_SAIDA_COM_ANEXO : undefined,
        tools: ferramentasAssistenteParaContexto({ permitirBuscaWeb: Boolean(anexoAtivo) }),
        stopWhen: stepCountIs(limitePassos),
      });

      writer.merge(resultado.toUIMessageStream());

      const textoResposta = await resultado.text;

      // Resposta vazia (ex.: modelo estourou o teto de tokens raciocinando) não pode falhar em
      // silêncio — loga o motivo e propaga para o onError mostrar o aviso em vez de "carregou e parou".
      if (!textoResposta.trim()) {
        const finishReason = await resultado.finishReason;

        console.error("[assistente] modelo não retornou texto", {
          finishReason,
          comAnexo: Boolean(anexoAtivo),
        });

        throw new Error(`O modelo não retornou texto (finishReason: ${finishReason}).`);
      }

      await salvarMensagemAssistente("assistente", textoResposta);

      if (
        anexoAtivo &&
        deveGerarDocumentoResumoPdf({ pergunta: textoUsuario, possuiAnexo: true })
      ) {
        writer.write({
          type: "data-documento-resumo",
          data: {
            documento: montarDocumentoResumoPdf({
              conteudo: textoResposta,
              nomeArquivo: anexoAtivo.nomeArquivo,
            }),
          },
        });
      }

      const sugestoes = await gerarSugestoesAssistente({
        buscarClientesParaSugestao: async () => {
          const clientes = await listarClientes();

          return clientes.slice(0, 4).map((cliente) => ({ nome: cliente.nome }));
        },
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
