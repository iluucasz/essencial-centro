import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agoraBrasilia,
  calcularVariacaoPercentual,
  capitalizarNome,
  cn,
  mesmoDiaCalendario,
  primeiroDiaDoMes,
  ultimoDiaDoMes,
} from "@/lib/utils";

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

describe("agoraBrasilia", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reflete o dia em Brasília mesmo quando o UTC já virou o dia seguinte", () => {
    // 21h30 em Brasília (17/07) == 00h30 UTC do dia 18 — o servidor (UTC) já está "amanhã".
    vi.setSystemTime(new Date("2026-07-18T00:30:00.000Z"));

    const agora = agoraBrasilia();

    expect(agora.getUTCFullYear()).toBe(2026);
    expect(agora.getUTCMonth()).toBe(6);
    expect(agora.getUTCDate()).toBe(17);
    expect(agora.getUTCHours()).toBe(21);
    expect(agora.getUTCMinutes()).toBe(30);
  });

  it("acompanha o horário normalmente fora da virada do dia", () => {
    // 10h da manhã em Brasília == 13h UTC, sem virada de dia em nenhum dos dois lados.
    vi.setSystemTime(new Date("2026-07-17T13:00:00.000Z"));

    const agora = agoraBrasilia();

    expect(agora.getUTCFullYear()).toBe(2026);
    expect(agora.getUTCMonth()).toBe(6);
    expect(agora.getUTCDate()).toBe(17);
    expect(agora.getUTCHours()).toBe(10);
  });
});

describe("capitalizarNome", () => {
  it("põe maiúscula no início de cada palavra e minúscula no resto", () => {
    expect(capitalizarNome("lucas SILVA santos")).toBe("Lucas Silva Santos");
    expect(capitalizarNome("MARIA")).toBe("Maria");
  });

  it("colapsa espaços duplicados e remove das pontas", () => {
    expect(capitalizarNome("  ana   clara  ")).toBe("Ana Clara");
  });

  it("capitaliza também depois de hífen e apóstrofo — nomes compostos comuns", () => {
    expect(capitalizarNome("maria-clara")).toBe("Maria-Clara");
    expect(capitalizarNome("d'ávila")).toBe("D'Ávila");
  });

  it("preserva acentuação ao capitalizar", () => {
    expect(capitalizarNome("josé antônio")).toBe("José Antônio");
  });

  it("mantém conector de nome composto em minúsculo — 'Maria Da Silva' não é como se escreve", () => {
    expect(capitalizarNome("MARIA DA SILVA")).toBe("Maria da Silva");
    expect(capitalizarNome("joão dos santos e souza")).toBe("João dos Santos e Souza");
  });

  it("capitaliza o conector quando ele é a primeira palavra do nome", () => {
    expect(capitalizarNome("do carmo")).toBe("Do Carmo");
  });
});

describe("mesmoDiaCalendario", () => {
  it("reconhece o mesmo dia mesmo com horas diferentes", () => {
    expect(
      mesmoDiaCalendario(
        new Date("2026-08-28T09:00:00.000Z"),
        new Date("2026-08-28T23:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("distingue dias diferentes", () => {
    expect(
      mesmoDiaCalendario(
        new Date("2026-08-28T09:00:00.000Z"),
        new Date("2026-08-29T09:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("distingue anos diferentes no mesmo mês/dia", () => {
    expect(
      mesmoDiaCalendario(
        new Date("2025-08-28T09:00:00.000Z"),
        new Date("2026-08-28T09:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
