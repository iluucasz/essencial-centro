import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("junta classes condicionais ignorando falsy", () => {
    expect(cn("p-2", false && "hidden", "text-brand")).toBe("p-2 text-brand");
  });

  it("resolve conflitos do Tailwind mantendo a última classe", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
