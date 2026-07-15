import { describe, expect, it } from "vitest";

import { podeAssinarDocumento } from "./assinatura";

describe("podeAssinarDocumento", () => {
  it("permite assinar um documento emitido", () => {
    expect(podeAssinarDocumento("emitido")).toBe(true);
  });

  it("bloqueia assinar um documento já assinado", () => {
    expect(podeAssinarDocumento("assinado")).toBe(false);
  });
});
