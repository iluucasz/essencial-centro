import { describe, expect, it } from "vitest";

import { encontrarConflito, intervalosSobrepoem } from "./sobreposicao";

describe("intervalosSobrepoem", () => {
  it("detecta sobreposição parcial", () => {
    const a = { inicio: new Date("2026-01-10T10:00:00"), duracaoMinutos: 60 };
    const b = { inicio: new Date("2026-01-10T10:30:00"), duracaoMinutos: 60 };

    expect(intervalosSobrepoem(a, b)).toBe(true);
  });

  it("não considera sobreposição quando um termina exatamente quando o outro começa", () => {
    const a = { inicio: new Date("2026-01-10T10:00:00"), duracaoMinutos: 60 };
    const b = { inicio: new Date("2026-01-10T11:00:00"), duracaoMinutos: 30 };

    expect(intervalosSobrepoem(a, b)).toBe(false);
  });

  it("não considera sobreposição entre horários distantes", () => {
    const a = { inicio: new Date("2026-01-10T08:00:00"), duracaoMinutos: 30 };
    const b = { inicio: new Date("2026-01-10T14:00:00"), duracaoMinutos: 30 };

    expect(intervalosSobrepoem(a, b)).toBe(false);
  });
});

describe("encontrarConflito", () => {
  it("retorna o primeiro agendamento conflitante", () => {
    const novo = { inicio: new Date("2026-01-10T09:00:00"), duracaoMinutos: 60 };
    const existentes = [
      { inicio: new Date("2026-01-10T07:00:00"), duracaoMinutos: 30 },
      { inicio: new Date("2026-01-10T09:30:00"), duracaoMinutos: 30 },
    ];

    expect(encontrarConflito(novo, existentes)).toBe(existentes[1]);
  });

  it("retorna null quando não há conflito", () => {
    const novo = { inicio: new Date("2026-01-10T09:00:00"), duracaoMinutos: 30 };
    const existentes = [{ inicio: new Date("2026-01-10T10:00:00"), duracaoMinutos: 30 }];

    expect(encontrarConflito(novo, existentes)).toBeNull();
  });
});
