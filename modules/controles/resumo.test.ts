import { describe, expect, it } from "vitest";

import { ultimaDataPorTipo } from "./resumo";

describe("ultimaDataPorTipo", () => {
  it("retorna null pra todo tipo sem nenhum registro", () => {
    const resultado = ultimaDataPorTipo([]);

    expect(resultado.calibracao_equipamentos).toBeNull();
    expect(resultado.limpeza_caixa_dagua).toBeNull();
    expect(resultado.dedetizacao).toBeNull();
    expect(resultado.coleta_materiais).toBeNull();
  });

  it("pega a data mais recente quando há mais de um registro do mesmo tipo", () => {
    const resultado = ultimaDataPorTipo([
      { tipo: "dedetizacao", dataRealizacao: new Date("2026-01-10") },
      { tipo: "dedetizacao", dataRealizacao: new Date("2026-06-15") },
      { tipo: "dedetizacao", dataRealizacao: new Date("2026-03-01") },
    ]);

    expect(resultado.dedetizacao).toEqual(new Date("2026-06-15"));
  });

  it("não confunde tipos diferentes entre si", () => {
    const resultado = ultimaDataPorTipo([
      { tipo: "limpeza_caixa_dagua", dataRealizacao: new Date("2026-02-01") },
      { tipo: "coleta_materiais", dataRealizacao: new Date("2026-05-01") },
    ]);

    expect(resultado.limpeza_caixa_dagua).toEqual(new Date("2026-02-01"));
    expect(resultado.coleta_materiais).toEqual(new Date("2026-05-01"));
    expect(resultado.calibracao_equipamentos).toBeNull();
  });
});
