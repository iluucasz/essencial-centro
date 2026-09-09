import { describe, expect, it } from "vitest";

import {
  autorizarAdmin,
  autorizarClienteDono,
  autorizarEscrita,
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

function sessaoComFuncao(
  role: "profissional" | "recepcao",
  funcao: "admin" | "manager" | "reader",
) {
  return {
    user: { id: `usuario-${role}-${funcao}`, role, ativo: true, funcao },
  } satisfies SessaoAutorizavel;
}

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

describe("autorizarAdmin", () => {
  it("só passa profissional com função admin — quem pede pra ver financeiro/relatórios/usuários", () => {
    expect(autorizarAdmin(sessaoComFuncao("profissional", "admin")).funcao).toBe("admin");
  });

  it("recusa profissional manager ou reader", () => {
    expect(() => autorizarAdmin(sessaoComFuncao("profissional", "manager"))).toThrow(
      ErroAutorizacao,
    );
    expect(() => autorizarAdmin(sessaoComFuncao("profissional", "reader"))).toThrow(
      ErroAutorizacao,
    );
  });

  it("recusa recepção mesmo com função admin salva por engano — papel é checado antes da função", () => {
    expect(() => autorizarAdmin(sessaoComFuncao("recepcao", "admin"))).toThrow(ErroAutorizacao);
  });

  it("recusa sessão sem função definida (legado)", () => {
    expect(() => autorizarAdmin(sessaoProfissional)).toThrow(ErroAutorizacao);
  });
});

describe("autorizarEscrita", () => {
  it("admin e manager passam normalmente", () => {
    expect(
      autorizarEscrita(sessaoComFuncao("profissional", "admin"), ["profissional"]).funcao,
    ).toBe("admin");
    expect(
      autorizarEscrita(sessaoComFuncao("profissional", "manager"), ["profissional"]).funcao,
    ).toBe("manager");
    expect(
      autorizarEscrita(sessaoComFuncao("recepcao", "manager"), ["profissional", "recepcao"]).funcao,
    ).toBe("manager");
  });

  it("reader é barrado — só visualiza, não muta nada", () => {
    expect(() =>
      autorizarEscrita(sessaoComFuncao("profissional", "reader"), ["profissional"]),
    ).toThrow(ErroAutorizacao);
    expect(() =>
      autorizarEscrita(sessaoComFuncao("recepcao", "reader"), ["profissional", "recepcao"]),
    ).toThrow(ErroAutorizacao);
  });

  it("sessão sem função definida (legado) passa — só reader restringe escrita", () => {
    expect(autorizarEscrita(sessaoProfissional, ["profissional"]).id).toBe("usuario-profissional");
  });

  it("continua recusando papel fora da lista permitida, igual autorizarPapel", () => {
    expect(() => autorizarEscrita(sessaoCliente, ["profissional"])).toThrow(ErroAutorizacao);
  });
});
