import { describe, expect, it } from "vitest";

import { personalizarMensagem } from "./mensagens";

describe("personalizarMensagem", () => {
  it("substitui {nome} pelo nome informado", () => {
    expect(personalizarMensagem("Olá, {nome}! Tudo bem?", "Ana")).toBe("Olá, Ana! Tudo bem?");
  });

  it("substitui todas as ocorrências, não só a primeira", () => {
    expect(personalizarMensagem("{nome}, {nome}, você foi sorteada!", "Ana")).toBe(
      "Ana, Ana, você foi sorteada!",
    );
  });

  it("não altera o texto quando não há o token", () => {
    expect(personalizarMensagem("Mensagem sem variável nenhuma.", "Ana")).toBe(
      "Mensagem sem variável nenhuma.",
    );
  });

  it("não confunde {NOME} maiúsculo com o token — só {nome} exato é suportado", () => {
    expect(personalizarMensagem("Olá, {NOME}!", "Ana")).toBe("Olá, {NOME}!");
  });
});
