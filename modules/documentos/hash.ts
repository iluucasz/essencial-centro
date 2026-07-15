import { createHash } from "node:crypto";

/** SHA-256 do conteúdo assinado — evidência de integridade (o que exatamente foi assinado). */
export function calcularHashConteudo(conteudo: string) {
  return createHash("sha256").update(conteudo, "utf8").digest("hex");
}
