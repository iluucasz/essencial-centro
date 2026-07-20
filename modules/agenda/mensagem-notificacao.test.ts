import { describe, expect, it } from "vitest";

import { mensagemAtendimentoCancelado, mensagemAtendimentoMarcado } from "./mensagem-notificacao";

// inicio é parede de Brasília nos campos UTC; a formatação em UTC tem que preservar 16:55 (não -3h),
// independente do fuso do processo (estes testes rodam em America/Sao_Paulo).
const inicio = new Date("2026-07-20T16:55:00.000Z");

describe("mensagemAtendimentoMarcado", () => {
  it("monta a mensagem de atendimento marcado com o horário de parede correto", () => {
    const texto = mensagemAtendimentoMarcado("Drenagem", inicio);

    expect(texto).toContain("está marcado para");
    expect(texto).toContain("16:55");
    expect(texto).toContain("Drenagem");
    expect(texto).toContain("QR de presença");
  });

  it("usa 'foi remarcado' quando é remarcação", () => {
    expect(mensagemAtendimentoMarcado("Drenagem", inicio, true)).toContain("foi remarcado");
  });
});

describe("mensagemAtendimentoCancelado", () => {
  it("monta a mensagem de cancelamento com o horário correto", () => {
    const texto = mensagemAtendimentoCancelado("Drenagem", inicio);

    expect(texto).toContain("foi cancelado");
    expect(texto).toContain("16:55");
  });
});
