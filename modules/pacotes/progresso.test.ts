import { describe, expect, it } from "vitest";

import { calcularProgressoPacote } from "./progresso";

describe("calcularProgressoPacote", () => {
  it("calcula restantes e percentual no caso comum", () => {
    const progresso = calcularProgressoPacote(10, 7);

    expect(progresso.sessoesRestantes).toBe(3);
    expect(progresso.percentualConcluido).toBe(70);
  });

  it("nunca deixa restantes negativo quando realizadas excede o contratado", () => {
    const progresso = calcularProgressoPacote(5, 8);

    expect(progresso.sessoesRealizadas).toBe(5);
    expect(progresso.sessoesRestantes).toBe(0);
    expect(progresso.percentualConcluido).toBe(100);
  });

  it("retorna 0% quando nenhuma sessão foi realizada", () => {
    const progresso = calcularProgressoPacote(4, 0);

    expect(progresso.percentualConcluido).toBe(0);
    expect(progresso.sessoesRestantes).toBe(4);
  });
});
