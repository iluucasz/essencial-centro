import { describe, expect, it } from "vitest";

import { montarPacotesEmDestaque } from "./destaque";

describe("montarPacotesEmDestaque", () => {
  it("mantem apenas pacotes ativos", () => {
    const destaques = montarPacotesEmDestaque(
      [
        { ativo: true, id: "pacote-ativo" },
        { ativo: false, id: "pacote-inativo" },
      ],
      [],
      new Date("2026-07-21T12:00:00.000Z"),
    );

    expect(destaques).toHaveLength(1);
    expect(destaques[0].id).toBe("pacote-ativo");
  });

  it("seleciona a proxima sessao marcada do pacote", () => {
    const agora = new Date("2026-07-21T12:00:00.000Z");
    const proxima = new Date("2026-07-22T20:00:00.000Z");

    const [destaque] = montarPacotesEmDestaque(
      [{ ativo: true, id: "pacote-1" }],
      [
        { inicio: new Date("2026-07-20T20:00:00.000Z"), pacoteId: "pacote-1", status: "marcado" },
        { inicio: new Date("2026-07-21T18:00:00.000Z"), pacoteId: "pacote-2", status: "marcado" },
        { inicio: new Date("2026-07-21T19:00:00.000Z"), pacoteId: "pacote-1", status: "falta" },
        { inicio: new Date("2026-07-23T20:00:00.000Z"), pacoteId: "pacote-1", status: "marcado" },
        { inicio: proxima, pacoteId: "pacote-1", status: "marcado" },
      ],
      agora,
    );

    expect(destaque.proximaSessao).toBe(proxima);
  });
});
