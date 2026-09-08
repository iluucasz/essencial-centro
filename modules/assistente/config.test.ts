import { describe, expect, it } from "vitest";

import { MAX_TOKENS_SAIDA_COM_ANEXO, OPCOES_PROVEDOR_DEEPSEEK } from "./config";

describe("configuração de raciocínio do assistente", () => {
  // Regressão: os modelos DeepSeek V4 vêm com "thinking" ligado por padrão. A mesma armadilha já
  // vista na Groq (raciocínio oculto consumindo todo o orçamento de saída sobre o contexto grande
  // do PDF, batendo o teto de tokens antes de escrever qualquer texto — finishReason "length",
  // resposta vazia) pode se repetir aqui. Não reativar o thinking sem revisar essa regressão.
  it("desliga o thinking da DeepSeek (evita resposta vazia com contexto grande)", () => {
    expect(OPCOES_PROVEDOR_DEEPSEEK.deepseek.thinking.type).toBe("disabled");
  });

  it("reserva um teto de saída generoso para o resumo completo caber", () => {
    expect(MAX_TOKENS_SAIDA_COM_ANEXO).toBeGreaterThanOrEqual(4000);
  });
});
