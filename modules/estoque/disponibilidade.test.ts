import { describe, expect, it } from "vitest";

import {
  calcularQuantidadeDisponivel,
  calcularStatusValidade,
  deveAvisarEstoqueBaixo,
} from "./disponibilidade";

describe("calcularQuantidadeDisponivel", () => {
  it("subtrai as saídas da quantidade inicial", () => {
    expect(calcularQuantidadeDisponivel(100, 30)).toBe(70);
  });

  it("nunca fica negativo mesmo se saídas excederem o inicial", () => {
    expect(calcularQuantidadeDisponivel(10, 15)).toBe(0);
  });
});

describe("deveAvisarEstoqueBaixo", () => {
  it("avisa quando disponível é menor ou igual ao mínimo", () => {
    expect(deveAvisarEstoqueBaixo(5, 5)).toBe(true);
    expect(deveAvisarEstoqueBaixo(3, 5)).toBe(true);
  });

  it("não avisa quando disponível está acima do mínimo", () => {
    expect(deveAvisarEstoqueBaixo(10, 5)).toBe(false);
  });

  it("nunca avisa quando o produto não define estoque mínimo", () => {
    expect(deveAvisarEstoqueBaixo(0, null)).toBe(false);
  });
});

describe("calcularStatusValidade", () => {
  const hoje = new Date("2026-07-15T12:00:00.000Z");

  it("retorna sem_validade quando o lote não tem data de validade", () => {
    expect(calcularStatusValidade(null, hoje)).toBe("sem_validade");
  });

  it("retorna vencido para data no passado", () => {
    expect(calcularStatusValidade(new Date("2026-07-01T00:00:00.000Z"), hoje)).toBe("vencido");
  });

  it("retorna proximo_vencimento dentro de 30 dias", () => {
    expect(calcularStatusValidade(new Date("2026-08-01T00:00:00.000Z"), hoje)).toBe(
      "proximo_vencimento",
    );
  });

  it("retorna ok para validade distante", () => {
    expect(calcularStatusValidade(new Date("2027-01-01T00:00:00.000Z"), hoje)).toBe("ok");
  });
});
