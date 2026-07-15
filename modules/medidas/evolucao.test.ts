import { describe, expect, it } from "vitest";

import { calcularEvolucaoMedida } from "./evolucao";

describe("calcularEvolucaoMedida", () => {
  it("calcula a redução entre a primeira e a última medição, independente da ordem de entrada", () => {
    const resultado = calcularEvolucaoMedida([
      { data: new Date("2026-03-01"), valorCm: 88 },
      { data: new Date("2026-02-01"), valorCm: 92 },
      { data: new Date("2026-04-01"), valorCm: 81 },
    ]);

    expect(resultado).not.toBeNull();
    expect(resultado?.inicial).toBe(92);
    expect(resultado?.atual).toBe(81);
    expect(resultado?.diferencaCm).toBe(-11);
    expect(resultado?.reducao).toBe(true);
    expect(resultado?.totalMedicoes).toBe(3);
  });

  it("identifica aumento (não é redução) quando a medida cresce", () => {
    const resultado = calcularEvolucaoMedida([
      { data: new Date("2026-01-01"), valorCm: 60 },
      { data: new Date("2026-02-01"), valorCm: 63 },
    ]);

    expect(resultado?.diferencaCm).toBe(3);
    expect(resultado?.reducao).toBe(false);
  });

  it("retorna diferença zero com uma única medição", () => {
    const resultado = calcularEvolucaoMedida([{ data: new Date("2026-01-01"), valorCm: 70 }]);

    expect(resultado?.diferencaCm).toBe(0);
    expect(resultado?.totalMedicoes).toBe(1);
  });

  it("retorna null para lista vazia", () => {
    expect(calcularEvolucaoMedida([])).toBeNull();
  });
});
