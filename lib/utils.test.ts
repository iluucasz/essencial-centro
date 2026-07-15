import { describe, expect, it } from "vitest";
import { calcularVariacaoPercentual, cn, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/utils";

describe("cn", () => {
  it("junta classes condicionais ignorando falsy", () => {
    expect(cn("p-2", false && "hidden", "text-brand")).toBe("p-2 text-brand");
  });

  it("resolve conflitos do Tailwind mantendo a última classe", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("calcularVariacaoPercentual", () => {
  it("calcula aumento percentual", () => {
    expect(calcularVariacaoPercentual(120, 100)).toBe(20);
  });

  it("calcula queda percentual", () => {
    expect(calcularVariacaoPercentual(80, 100)).toBe(-20);
  });

  it("retorna 0 quando não houve variação nem base", () => {
    expect(calcularVariacaoPercentual(0, 0)).toBe(0);
  });

  it("retorna null quando não há base de comparação válida", () => {
    expect(calcularVariacaoPercentual(50, 0)).toBeNull();
  });
});

describe("primeiroDiaDoMes / ultimoDiaDoMes", () => {
  it("calcula os limites do mês em UTC", () => {
    const data = new Date("2026-07-15T18:30:00.000Z");

    expect(primeiroDiaDoMes(data).toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(ultimoDiaDoMes(data).toISOString()).toBe("2026-07-31T23:59:59.999Z");
  });

  it("volta um mês corretamente na virada do ano", () => {
    const janeiro = new Date(Date.UTC(2026, 0, 15));
    const mesAnterior = new Date(Date.UTC(janeiro.getUTCFullYear(), janeiro.getUTCMonth() - 1, 1));

    expect(primeiroDiaDoMes(mesAnterior).toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(ultimoDiaDoMes(mesAnterior).toISOString()).toBe("2025-12-31T23:59:59.999Z");
  });
});
