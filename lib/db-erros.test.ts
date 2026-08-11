import { describe, expect, it } from "vitest";

import { violaConstraintUnica } from "./db-erros";

/** Reproduz o formato real: DrizzleQueryError(`.message` genérica) com `.cause` = NeonDbError. */
function erroDrizzleSimulado(constraint: string) {
  const causa = Object.assign(
    new Error(`duplicate key value violates unique constraint "${constraint}"`),
    {
      name: "NeonDbError",
      constraint,
      code: "23505",
    },
  );

  return Object.assign(new Error("Failed query: insert into ... params: ..."), { cause: causa });
}

describe("violaConstraintUnica", () => {
  it("identifica a constraint mesmo com a .message genérica do DrizzleQueryError", () => {
    // Este é o formato real: `.message` do erro capturado NÃO contém o nome da constraint.
    const erro = erroDrizzleSimulado("usuario_email_unique");

    expect(erro.message).not.toContain("usuario_email_unique");
    expect(violaConstraintUnica(erro, "usuario_email_unique")).toBe(true);
  });

  it("não confunde com outra constraint", () => {
    const erro = erroDrizzleSimulado("cliente_email_unique");

    expect(violaConstraintUnica(erro, "usuario_email_unique")).toBe(false);
  });

  it("cai no fallback quando a mensagem já traz a constraint direto", () => {
    const erro = new Error('duplicate key value violates unique constraint "usuario_email_unique"');

    expect(violaConstraintUnica(erro, "usuario_email_unique")).toBe(true);
  });

  it("não é confundido por erro sem relação nenhuma", () => {
    expect(violaConstraintUnica(new Error("timeout de conexão"), "usuario_email_unique")).toBe(
      false,
    );
    expect(violaConstraintUnica("não é nem um Error", "usuario_email_unique")).toBe(false);
    expect(violaConstraintUnica(null, "usuario_email_unique")).toBe(false);
  });
});
