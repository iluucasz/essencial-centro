import { describe, expect, it } from "vitest";

import { podeAlternarAtivoDe, podeExcluirUsuario } from "./gestao";

describe("podeAlternarAtivoDe", () => {
  it("permite alternar o status de outro usuário", () => {
    expect(podeAlternarAtivoDe("usuario-alvo", "usuario-atual")).toBe(true);
  });

  it("recusa alternar o próprio status", () => {
    expect(podeAlternarAtivoDe("mesmo-id", "mesmo-id")).toBe(false);
  });
});

describe("podeExcluirUsuario", () => {
  it("permite excluir conta cliente — é só o login do portal, sem histórico clínico vinculado", () => {
    expect(podeExcluirUsuario("cliente")).toBe(true);
  });

  it("recusa excluir profissional/recepção — FK restrict em tabelas clínicas bloquearia o DELETE", () => {
    expect(podeExcluirUsuario("profissional")).toBe(false);
    expect(podeExcluirUsuario("recepcao")).toBe(false);
  });
});
