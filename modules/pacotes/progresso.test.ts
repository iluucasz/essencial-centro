import { describe, expect, it } from "vitest";

import { calcularProgressoPacote, deveAvisarPacoteAcabando } from "./progresso";

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

describe("deveAvisarPacoteAcabando", () => {
  it("avisa quando resta 1 sessão", () => {
    expect(deveAvisarPacoteAcabando(1)).toBe(true);
  });

  it("avisa quando o pacote já acabou (0 restantes)", () => {
    expect(deveAvisarPacoteAcabando(0)).toBe(true);
  });

  it("não avisa quando ainda restam 2 ou mais sessões", () => {
    expect(deveAvisarPacoteAcabando(2)).toBe(false);
    expect(deveAvisarPacoteAcabando(5)).toBe(false);
  });
});
