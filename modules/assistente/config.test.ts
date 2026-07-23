import { describe, expect, it } from "vitest";

import { ESFORCO_RACIOCINIO_COM_ANEXO, MAX_TOKENS_SAIDA_COM_ANEXO } from "./config";

describe("configuração de raciocínio do assistente no modo anexo", () => {
  // Regressão: reasoningEffort "high" sobre o contexto grande do PDF fazia o gpt-oss gastar todo o
  // orçamento de saída em raciocínio oculto e bater o teto de tokens antes de escrever qualquer
  // texto (finishReason "length") → resposta vazia, "carregou e parou". Não voltar para "high".
  it("não usa esforço de raciocínio 'high' (estoura o orçamento de tokens e volta vazio)", () => {
    expect(ESFORCO_RACIOCINIO_COM_ANEXO).not.toBe("high");
  });

  it("reserva um teto de saída generoso para o resumo completo caber", () => {
    expect(MAX_TOKENS_SAIDA_COM_ANEXO).toBeGreaterThanOrEqual(4000);
  });
});
