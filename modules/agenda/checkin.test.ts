import { describe, expect, it } from "vitest";

import { podeConfirmarPresenca } from "./checkin";

describe("podeConfirmarPresenca", () => {
  it("permite confirmar quando o agendamento está marcado e sem check-in prévio", () => {
    expect(podeConfirmarPresenca("marcado", null)).toBe(true);
  });

  it("bloqueia quando já houve check-in", () => {
    expect(podeConfirmarPresenca("marcado", new Date())).toBe(false);
  });

  it("bloqueia quando o agendamento não está mais marcado", () => {
    expect(podeConfirmarPresenca("realizado", null)).toBe(false);
    expect(podeConfirmarPresenca("falta", null)).toBe(false);
    expect(podeConfirmarPresenca("cancelado", null)).toBe(false);
  });
});
