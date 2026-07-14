import { describe, expect, it } from "vitest";

import {
  autorizarClienteDono,
  autorizarPapel,
  ErroAutorizacao,
  getDestinoAposLogin,
  podeAcessarArea,
  type SessaoAutorizavel,
} from "./rbac";

const sessaoProfissional: SessaoAutorizavel = {
  user: {
    id: "usuario-profissional",
    role: "profissional",
    ativo: true,
  },
};

const sessaoCliente: SessaoAutorizavel = {
  user: {
    id: "usuario-cliente",
    role: "cliente",
    clienteId: "cliente-1",
    ativo: true,
  },
};

describe("rbac", () => {
  it("direciona e libera acesso conforme papel", () => {
    expect(getDestinoAposLogin("cliente")).toBe("/portal");
    expect(getDestinoAposLogin("profissional")).toBe("/painel");
    expect(podeAcessarArea("cliente", "portal")).toBe(true);
    expect(podeAcessarArea("cliente", "painel")).toBe(false);
    expect(podeAcessarArea("recepcao", "painel")).toBe(true);
  });

  it("autoriza apenas papéis permitidos", () => {
    expect(autorizarPapel(sessaoProfissional, ["profissional"]).id).toBe("usuario-profissional");
    expect(() => autorizarPapel(sessaoCliente, ["profissional"])).toThrow(ErroAutorizacao);
    expect(() => autorizarPapel(null, ["cliente"])).toThrow(ErroAutorizacao);
  });

  it("impede cliente de acessar recurso de outro cliente", () => {
    expect(autorizarClienteDono(sessaoCliente, "cliente-1").id).toBe("usuario-cliente");
    expect(() => autorizarClienteDono(sessaoCliente, "cliente-2")).toThrow(ErroAutorizacao);
    expect(autorizarClienteDono(sessaoProfissional, "cliente-2").id).toBe("usuario-profissional");
  });
});
