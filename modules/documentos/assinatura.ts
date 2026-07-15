import type { StatusDocumento } from "./schema";

export function podeAssinarDocumento(status: StatusDocumento) {
  return status === "emitido";
}

/**
 * Defesa em profundidade contra assinatura vazia/malformada — nunca confiar só na validação do
 * canvas no cliente. Um canvas em branco exportado via `toDataURL` ainda gera um PNG válido (só o
 * cabeçalho), então o limite de tamanho distingue "sem traço" de uma assinatura real desenhada.
 */
export function assinaturaValida(dataUrl: string | null | undefined) {
  if (!dataUrl) return false;
  if (!dataUrl.startsWith("data:image/png;base64,")) return false;

  return dataUrl.length > 400;
}
