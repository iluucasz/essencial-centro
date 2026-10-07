import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  obterStatus: vi.fn(),
  criar: vi.fn(),
  desconectar: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/modules/whatsapp/conexao", () => {
  // Classe própria em vez do `importActual`: o módulo real puxa `@/db`, que exige DATABASE_URL.
  class ErroConexaoWhatsApp extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  }

  return {
    ErroConexaoWhatsApp,
    obterStatusConexaoWhatsApp: mocks.obterStatus,
    criarConexaoWhatsApp: mocks.criar,
    desconectarWhatsApp: mocks.desconectar,
  };
});

import { ErroConexaoWhatsApp } from "@/modules/whatsapp/conexao";

import { DELETE, GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "id", role: "profissional", funcao: "admin" } });
});

describe("/api/whatsapp/instance", () => {
  it.each([
    [null, 401],
    [{ user: { id: "id", role: "cliente" } }, 403],
    [{ user: { id: "id", role: "recepcao", funcao: "admin" } }, 403],
    [{ user: { id: "id", role: "profissional", funcao: "manager" } }, 403],
  ])("só admin da clínica acessa: %j → %i", async (sessao, status) => {
    mocks.auth.mockResolvedValue(sessao);

    for (const rota of [GET, POST, DELETE]) {
      const resposta = await rota();
      expect(resposta.status).toBe(status);
      expect(await resposta.json()).toHaveProperty("error");
    }
    expect(mocks.obterStatus).not.toHaveBeenCalled();
    expect(mocks.criar).not.toHaveBeenCalled();
    expect(mocks.desconectar).not.toHaveBeenCalled();
  });

  it("admin recebe o status em JSON", async () => {
    mocks.obterStatus.mockResolvedValue({ state: "connected" });

    const resposta = await GET();

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ state: "connected" });
  });

  it.each([409, 502, 503])("erro de conexão vira { error } com status %i", async (status) => {
    mocks.criar.mockRejectedValue(new ErroConexaoWhatsApp("Mensagem em português", status as 409));

    const resposta = await POST();

    expect(resposta.status).toBe(status);
    expect(await resposta.json()).toEqual({ error: "Mensagem em português" });
  });
});
