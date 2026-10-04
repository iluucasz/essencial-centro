import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { autorizarEscrita, ErroAutorizacao } from "@/modules/auth/rbac";
import {
  limiteArquivoSite,
  tiposArquivoSite,
  tiposAudioSite,
} from "@/modules/site-publico/validacao";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const resultado = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        autorizarEscrita(await auth(), ["profissional"]);
        if (
          !/^site-publico\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|mp4|webm|mp3|m4a|aac|ogg)$/.test(
            pathname,
          )
        )
          throw new Error("Arquivo inválido.");
        if (clientPayload !== "publicacao-autorizada")
          throw new Error("Confirme a autorização de publicação.");
        return {
          allowedContentTypes: [...tiposArquivoSite, ...tiposAudioSite],
          maximumSizeInBytes: limiteArquivoSite,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
    });
    return Response.json(resultado);
  } catch (erro) {
    return Response.json(
      {
        error:
          erro instanceof ErroAutorizacao
            ? erro.message
            : "Não foi possível enviar o arquivo. Confira o formato e a autorização.",
      },
      { status: erro instanceof ErroAutorizacao ? erro.status : 400 },
    );
  }
}
