import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatarNumeroWhatsApp, mapearEstadoEvolution } from "./conexao-tipos";
import {
  buscarQrCode,
  consultarInstancia,
  criarInstancia,
  extrairQrCode,
  lerConfiguracaoEvolution,
  localizarInstancia,
} from "./evolution";

const config = { apiUrl: "https://evo.exemplo.com", apiKey: "chave-global" };
const fetchMock = vi.fn();

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("lerConfiguracaoEvolution", () => {
  it("exige URL e chave", () => {
    vi.stubEnv("EVOLUTION_API_URL", "https://evo.exemplo.com");
    vi.stubEnv("EVOLUTION_API_KEY", "");

    expect(lerConfiguracaoEvolution()).toBeNull();
  });

  it("tira espaços e barras finais da URL — senão vira `//instance` e a Evolution dá 404", () => {
    vi.stubEnv("EVOLUTION_API_URL", "  https://evo.exemplo.com//  ");
    vi.stubEnv("EVOLUTION_API_KEY", "chave-global");

    expect(lerConfiguracaoEvolution()).toEqual(config);
  });
});

describe("mapearEstadoEvolution", () => {
  it.each([
    ["open", "connected"],
    ["connecting", "connecting"],
    ["close", "disconnected"],
    ["closed", "disconnected"],
    ["refused", "unknown"],
    [null, "unknown"],
  ] as const)("%s → %s", (estado, esperado) => {
    expect(mapearEstadoEvolution(estado)).toBe(esperado);
  });
});

describe("extrairQrCode", () => {
  it("lê `qrcode.base64` e acrescenta o prefixo data: quando falta", () => {
    expect(extrairQrCode({ qrcode: { base64: "AAAA", pairingCode: "ABCD1234" } })).toEqual({
      base64: "data:image/png;base64,AAAA",
      pairingCode: "ABCD1234",
    });
  });

  it("lê `base64` na raiz e mantém um data URI já pronto", () => {
    expect(extrairQrCode({ base64: "data:image/png;base64,BBBB" })).toEqual({
      base64: "data:image/png;base64,BBBB",
      pairingCode: null,
    });
  });

  it("sem QR, devolve null", () => {
    expect(extrairQrCode({ instance: { state: "open" } })).toBeNull();
    expect(extrairQrCode(null)).toBeNull();
  });
});

describe("localizarInstancia", () => {
  it("formato v2 (array plano): estado de connectionStatus e número do ownerJid", () => {
    const dados = [
      { name: "outra", connectionStatus: "open" },
      {
        name: "essencial-centro",
        connectionStatus: "open",
        ownerJid: "5511987654321:12@s.whatsapp.net",
        profileName: "Clínica",
      },
    ];

    expect(localizarInstancia(dados, "essencial-centro")).toEqual({
      estado: "open",
      numero: "5511987654321",
      nomePerfil: "Clínica",
    });
  });

  it("formato v1 (objeto aninhado em .instance): instanceName, status e owner", () => {
    const dados = {
      instance: {
        instanceName: "essencial-centro",
        status: "close",
        owner: "5521999998888@s.whatsapp.net",
      },
    };

    expect(localizarInstancia(dados, "essencial-centro")).toEqual({
      estado: "close",
      numero: "5521999998888",
      nomePerfil: null,
    });
  });

  it("ignora instâncias de outro nome", () => {
    expect(localizarInstancia([{ name: "outra", state: "open" }], "essencial-centro")).toBeNull();
  });
});

describe("chamadas HTTP", () => {
  it("manda apikey e Content-Type e codifica o nome no caminho", async () => {
    fetchMock.mockResolvedValue(respostaJson({ base64: "QR" }));

    await buscarQrCode(config, "nome com espaço");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://evo.exemplo.com/instance/connect/nome%20com%20espa%C3%A7o");
    expect(init.headers).toEqual({ apikey: "chave-global", "Content-Type": "application/json" });
  });

  it("cria com integração Baileys e qrcode: true", async () => {
    fetchMock.mockResolvedValue(respostaJson({ qrcode: { base64: "QR" } }));

    const resultado = await criarInstancia(config, "essencial-centro");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      instanceName: "essencial-centro",
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    });
    expect(resultado).toEqual({
      ok: true,
      qr: { base64: "data:image/png;base64,QR", pairingCode: null },
    });
  });

  it("connect com state open = conectado, sem QR", async () => {
    fetchMock.mockResolvedValue(respostaJson({ instance: { state: "open" } }));

    expect(await buscarQrCode(config, "essencial-centro")).toEqual({
      ok: true,
      conectado: true,
      qr: null,
    });
  });

  it("404 no fetchInstances = instância não existe (não é erro)", async () => {
    fetchMock.mockResolvedValue(new Response("Not Found", { status: 404 }));

    expect(await consultarInstancia(config, "essencial-centro")).toEqual({
      ok: true,
      instancia: null,
    });
  });

  it("resposta não-OK vira erro legível com até 200 caracteres do corpo, sem lançar", async () => {
    fetchMock.mockResolvedValue(new Response("x".repeat(500), { status: 401 }));

    const resultado = await consultarInstancia(config, "essencial-centro");

    expect(resultado).toEqual({
      ok: false,
      error: `Evolution API respondeu 401: ${"x".repeat(200)}`,
    });
  });

  it("timeout vira mensagem própria, sem lançar", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    expect(await criarInstancia(config, "essencial-centro")).toEqual({
      ok: false,
      error: "Tempo limite ao chamar a Evolution API",
    });
  });
});

describe("formatarNumeroWhatsApp", () => {
  it("formata celular brasileiro e deixa o resto com +", () => {
    expect(formatarNumeroWhatsApp("5511987654321")).toBe("+55 (11) 98765-4321");
    expect(formatarNumeroWhatsApp("552133334444")).toBe("+55 (21) 3333-4444");
    expect(formatarNumeroWhatsApp("14155550100")).toBe("+14155550100");
  });
});
