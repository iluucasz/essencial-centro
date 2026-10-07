import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lerConexao: vi.fn(),
  registrar: vi.fn(),
  atualizar: vi.fn(),
  limpar: vi.fn(),
  config: vi.fn(),
  consultar: vi.fn(),
  criar: vi.fn(),
  qrCode: vi.fn(),
  desconectar: vi.fn(),
}));

vi.mock("./conexao-repositorio", () => ({
  lerConexaoWhatsApp: mocks.lerConexao,
  registrarInstanciaWhatsApp: mocks.registrar,
  atualizarConexaoWhatsApp: mocks.atualizar,
  limparConexaoWhatsApp: mocks.limpar,
}));
vi.mock("./evolution", () => ({
  lerConfiguracaoEvolution: mocks.config,
  consultarInstancia: mocks.consultar,
  criarInstancia: mocks.criar,
  buscarQrCode: mocks.qrCode,
  desconectarInstancia: mocks.desconectar,
}));

import {
  criarConexaoWhatsApp,
  desconectarWhatsApp,
  ErroConexaoWhatsApp,
  gerarQrCodeWhatsApp,
  NOME_INSTANCIA_WHATSAPP,
  obterStatusConexaoWhatsApp,
} from "./conexao";

const config = { apiUrl: "https://evo", apiKey: "k" };
const qr = { base64: "data:image/png;base64,QR", pairingCode: null };

function registro(sobrescrever: Record<string, unknown> = {}) {
  return {
    chave: "clinica",
    nomeInstancia: NOME_INSTANCIA_WHATSAPP,
    instanciaCriadaEm: new Date("2026-10-01T12:00:00Z"),
    estado: "connecting",
    numeroConectado: null,
    nomeConectado: null,
    verificadoEm: null,
    ...sobrescrever,
  };
}

async function esperarErro(promessa: Promise<unknown>, status: number) {
  const erro = await promessa.catch((e: unknown) => e);
  expect(erro).toBeInstanceOf(ErroConexaoWhatsApp);
  expect((erro as ErroConexaoWhatsApp).status).toBe(status);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockReturnValue(config);
  mocks.lerConexao.mockResolvedValue(null);
  mocks.registrar.mockImplementation(async (valores) => registro(valores));
  mocks.atualizar.mockImplementation(async (valores) => registro(valores));
});

describe("configuração", () => {
  it("sem URL/chave da Evolution, toda operação responde 503", async () => {
    mocks.config.mockReturnValue(null);

    await esperarErro(obterStatusConexaoWhatsApp(), 503);
    await esperarErro(criarConexaoWhatsApp(), 503);
    await esperarErro(gerarQrCodeWhatsApp(), 503);
    await esperarErro(desconectarWhatsApp(), 503);
  });
});

describe("obterStatusConexaoWhatsApp", () => {
  it("sem instância gravada → not_created, sem chamar o servidor", async () => {
    expect((await obterStatusConexaoWhatsApp()).state).toBe("not_created");
    expect(mocks.consultar).not.toHaveBeenCalled();
  });

  it("atualiza estado, número e nome a cada consulta", async () => {
    mocks.lerConexao.mockResolvedValue(registro());
    mocks.consultar.mockResolvedValue({
      ok: true,
      instancia: { estado: "open", numero: "5511987654321", nomePerfil: "Clínica" },
    });

    const status = await obterStatusConexaoWhatsApp();

    expect(mocks.atualizar).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: "connected",
        numeroConectado: "5511987654321",
        nomeConectado: "Clínica",
        verificadoEm: expect.any(Date),
      }),
    );
    expect(status).toMatchObject({
      created: true,
      state: "connected",
      number: "5511987654321",
      profileName: "Clínica",
      error: null,
    });
  });

  it("instância removida do servidor → limpa o banco e volta not_created", async () => {
    mocks.lerConexao.mockResolvedValue(registro());
    mocks.consultar.mockResolvedValue({ ok: true, instancia: null });

    expect((await obterStatusConexaoWhatsApp()).state).toBe("not_created");
    expect(mocks.limpar).toHaveBeenCalled();
  });

  it("servidor fora do ar → unknown com o erro, sem apagar nada", async () => {
    mocks.lerConexao.mockResolvedValue(registro({ estado: "connected" }));
    mocks.consultar.mockResolvedValue({
      ok: false,
      error: "Tempo limite ao chamar a Evolution API",
    });

    const status = await obterStatusConexaoWhatsApp();

    expect(status).toMatchObject({
      state: "unknown",
      error: "Tempo limite ao chamar a Evolution API",
    });
    expect(mocks.limpar).not.toHaveBeenCalled();
    expect(mocks.atualizar).not.toHaveBeenCalled();
  });
});

describe("criarConexaoWhatsApp", () => {
  it("cria a instância, grava como connecting e devolve o QR da criação", async () => {
    mocks.consultar.mockResolvedValue({ ok: true, instancia: null });
    mocks.criar.mockResolvedValue({ ok: true, qr });

    const resposta = await criarConexaoWhatsApp();

    expect(mocks.criar).toHaveBeenCalledWith(config, NOME_INSTANCIA_WHATSAPP);
    expect(mocks.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ nomeInstancia: NOME_INSTANCIA_WHATSAPP, estado: "connecting" }),
    );
    expect(mocks.qrCode).not.toHaveBeenCalled();
    expect(resposta).toMatchObject({ status: { created: true, state: "connecting" }, qr });
  });

  it("criação sem QR na resposta → busca em /instance/connect", async () => {
    mocks.consultar.mockResolvedValue({ ok: true, instancia: null });
    mocks.criar.mockResolvedValue({ ok: true, qr: null });
    mocks.qrCode.mockResolvedValue({ ok: true, conectado: false, qr });

    expect((await criarConexaoWhatsApp()).qr).toEqual(qr);
  });

  it("nome já existe no servidor sem estar gravado como nosso → 409, sem criar nem gravar", async () => {
    mocks.consultar.mockResolvedValue({
      ok: true,
      instancia: { estado: "open", numero: "5511900000000", nomePerfil: "Outra pessoa" },
    });

    await esperarErro(criarConexaoWhatsApp(), 409);
    expect(mocks.criar).not.toHaveBeenCalled();
    expect(mocks.registrar).not.toHaveBeenCalled();
  });

  it("já tem instância gravada → devolve status e QR novo, sem criar outra", async () => {
    mocks.lerConexao.mockResolvedValue(registro({ estado: "disconnected" }));
    mocks.consultar.mockResolvedValue({
      ok: true,
      instancia: { estado: "close", numero: null, nomePerfil: null },
    });
    mocks.qrCode.mockResolvedValue({ ok: true, conectado: false, qr });

    const resposta = await criarConexaoWhatsApp();

    expect(mocks.criar).not.toHaveBeenCalled();
    expect(resposta).toMatchObject({ status: { state: "disconnected" }, qr });
  });

  it("servidor recusou a criação → 502", async () => {
    mocks.consultar.mockResolvedValue({ ok: true, instancia: null });
    mocks.criar.mockResolvedValue({ ok: false, error: "Evolution API respondeu 500: erro" });

    await esperarErro(criarConexaoWhatsApp(), 502);
    expect(mocks.registrar).not.toHaveBeenCalled();
  });
});

describe("gerarQrCodeWhatsApp", () => {
  it("sem instância gravada → 409", async () => {
    await esperarErro(gerarQrCodeWhatsApp(), 409);
  });

  it("já conectado → connected: true, sem QR", async () => {
    mocks.lerConexao.mockResolvedValue(registro());
    mocks.qrCode.mockResolvedValue({ ok: true, conectado: true, qr: null });

    expect(await gerarQrCodeWhatsApp()).toEqual({ connected: true, qr: null });
  });

  it("devolve o QR novo", async () => {
    mocks.lerConexao.mockResolvedValue(registro());
    mocks.qrCode.mockResolvedValue({ ok: true, conectado: false, qr });

    expect(await gerarQrCodeWhatsApp()).toEqual({ connected: false, qr });
  });
});

describe("desconectarWhatsApp", () => {
  it("faz logout e grava disconnected com número e nome nulos", async () => {
    mocks.lerConexao.mockResolvedValue(
      registro({ estado: "connected", numeroConectado: "5511987654321", nomeConectado: "Clínica" }),
    );
    mocks.desconectar.mockResolvedValue({ ok: true });

    const status = await desconectarWhatsApp();

    expect(mocks.desconectar).toHaveBeenCalledWith(config, NOME_INSTANCIA_WHATSAPP);
    expect(mocks.atualizar).toHaveBeenCalledWith(
      expect.objectContaining({
        estado: "disconnected",
        numeroConectado: null,
        nomeConectado: null,
      }),
    );
    expect(status).toMatchObject({ state: "disconnected", number: null, profileName: null });
  });

  it("logout recusado pelo servidor → 502, sem mexer no banco", async () => {
    mocks.lerConexao.mockResolvedValue(registro({ estado: "connected" }));
    mocks.desconectar.mockResolvedValue({ ok: false, error: "Evolution API respondeu 400: x" });

    await esperarErro(desconectarWhatsApp(), 502);
    expect(mocks.atualizar).not.toHaveBeenCalled();
  });
});
