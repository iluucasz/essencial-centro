import { LIMITE_MENSAGENS_CONTEXTO } from "./config";

/** Corta pras últimas N mensagens antes de mandar pro modelo — teto de custo/token por turno. */
export function montarJanelaContexto<T>(
  mensagens: T[],
  limite: number = LIMITE_MENSAGENS_CONTEXTO,
): T[] {
  return mensagens.length <= limite ? mensagens : mensagens.slice(-limite);
}
