import { createHash } from "node:crypto";

/** SHA-256 do template — calculado sempre no servidor a partir dos bytes recebidos, nunca aceito
 * do chamador (mesmo princípio de modules/documentos/hash.ts para a assinatura eletrônica). */
export function calcularHashTemplate(templateBase64: string) {
  return createHash("sha256").update(templateBase64, "utf8").digest("hex");
}
