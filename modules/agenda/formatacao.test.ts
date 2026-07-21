import { describe, expect, it } from "vitest";

import { formatarHorarioPresenca } from "./formatacao";

describe("formatarHorarioPresenca", () => {
  it("mostra o horário real do check-in em Brasília", () => {
    expect(formatarHorarioPresenca(new Date("2026-07-21T23:31:00.000Z"))).toBe("20:31");
  });
});
