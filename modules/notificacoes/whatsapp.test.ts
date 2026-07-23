import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  consultarStatusConexaoWhatsApp,
  enviarWhatsAppTexto,
  normalizarTelefone,
} from "./whatsapp";

const ambienteOriginal = { ...process.env };

function configurarAmbiente() {
  process.env.EVOLUTION_API_URL = "https://evolution.example.com";
  process.env.EVOLUTION_API_KEY = "chave-teste";
  process.env.EVOLUTION_INSTANCE = "clinica";
}

describe("normalizarTelefone", () => {
  it("adiciona o código do país quando ausente (DDD + número, 11 dígitos)", () => {
    expect(normalizarTelefone("21999999999")).toBe("5521999999999");
  });

  it("adiciona o código do país quando ausente (DDD + número, 10 dígitos)", () => {
    expect(normalizarTelefone("2133334444")).toBe("552133334444");
  });

  it("remove formatação (parênteses, espaço, hífen, +) e mantém o código do país", () => {
    expect(normalizarTelefone("+55 (21) 99999-9999")).toBe("5521999999999");
  });

  it("mantém como está quando já tem código do país", () => {
    expect(normalizarTelefone("5521999999999")).toBe("5521999999999");
  });

  it("insere o 9º dígito em celular no formato antigo (DDD + 8 dígitos)", () => {
    // "2197316015" = DDD 21 + celular antigo "97316015" → vira "5521997316015".
    expect(normalizarTelefone("2197316015")).toBe("5521997316015");
    // Mesmo número já com o 9 e um espaço no meio → estável.
    expect(normalizarTelefone("21 997316015")).toBe("5521997316015");
    // Idempotente com o código do país presente mas sem o 9º dígito.
    expect(normalizarTelefone("552197316015")).toBe("5521997316015");
  });

  it("não insere 9 em telefone fixo (número começando por 2–5)", () => {
    expect(normalizarTelefone("2133334444")).toBe("552133334444");
  });

  it("aceita variações de digitação do mesmo número", () => {
    for (const entrada of [
      "21 973165015",
      "(21) 97316-5015",
      "+55 21 97316-5015",
      "021 97316-5015",
      "55 21 97316 5015",
    ]) {
      expect(normalizarTelefone(entrada)).toBe("5521973165015");
    }
  });

  it("não confunde o DDD 55 (Santa Maria) com o código do país", () => {
    // DDD 55 + celular 9 dígitos, sem código do país → prefixa 55 (país) sem remover o DDD 55.
    expect(normalizarTelefone("55999912345")).toBe("5555999912345");
  });

  it("nunca inclui @s.whatsapp.net no resultado", () => {
    expect(normalizarTelefone("5521999999999")?.includes("@")).toBe(false);
  });

  it("retorna null pra formato não reconhecível", () => {
    expect(normalizarTelefone("123")).toBeNull();
    expect(normalizarTelefone("")).toBeNull();
    expect(normalizarTelefone("abc def")).toBeNull();
  });
});

describe("enviarWhatsAppTexto", () => {
  beforeEach(() => {
    process.env = { ...ambienteOriginal };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    vi.restoreAllMocks();
  });

  it("não chama a API quando a Evolution não está configurada", async () => {
    delete process.env.EVOLUTION_API_URL;
    delete process.env.EVOLUTION_API_KEY;
    delete process.env.EVOLUTION_INSTANCE;
    const fetchMock = vi.spyOn(global, "fetch");

    const resultado = await enviarWhatsAppTexto({
      telefone: "21999999999",
      mensagem: "Olá",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(resultado).toEqual({ attempted: false, sent: false, error: null });
  });

  it("envia com o número normalizado e o corpo esperado quando configurada", async () => {
    configurarAmbiente();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ key: { id: "abc" } }), { status: 201 }));

    const resultado = await enviarWhatsAppTexto({
      telefone: "(21) 99999-9999",
      mensagem: "Seu atendimento é amanhã.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://evolution.example.com/message/sendText/clinica");
    expect(opcoes?.method).toBe("POST");
    expect((opcoes?.headers as Record<string, string>).apikey).toBe("chave-teste");

    const corpo = JSON.parse(opcoes?.body as string);
    expect(corpo.number).toBe("5521999999999");
    expect(corpo.number.includes("@")).toBe(false);
    expect(corpo.text).toBe("Seu atendimento é amanhã.");
    expect(resultado).toEqual({ attempted: true, sent: true, error: null });
  });

  it("não chama a API e retorna erro quando o telefone é inválido", async () => {
    configurarAmbiente();
    const fetchMock = vi.spyOn(global, "fetch");

    const resultado = await enviarWhatsAppTexto({ telefone: "123", mensagem: "Olá" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(resultado.attempted).toBe(false);
    expect(resultado.sent).toBe(false);
    expect(resultado.error).toBeTruthy();
  });

  it("retorna erro estruturado numa resposta 401 (chave inválida), sem lançar", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await enviarWhatsAppTexto({ telefone: "21999999999", mensagem: "Olá" });

    expect(resultado).toEqual({
      attempted: true,
      sent: false,
      error: "Evolution API respondeu 401.",
    });
  });

  it("retorna erro estruturado numa resposta 404 (instância inexistente), sem lançar", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("Not Found", { status: 404 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await enviarWhatsAppTexto({ telefone: "21999999999", mensagem: "Olá" });

    expect(resultado).toEqual({
      attempted: true,
      sent: false,
      error: "Evolution API respondeu 404.",
    });
  });

  it("não lança em erro de rede — retorna erro estruturado (não bloqueia o e-mail/fluxo principal)", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("rede indisponível"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      enviarWhatsAppTexto({ telefone: "21999999999", mensagem: "Olá" }),
    ).resolves.toEqual({
      attempted: true,
      sent: false,
      error: "Erro ao chamar a Evolution API.",
    });
  });

  it("não lança em timeout — retorna erro estruturado específico de tempo limite", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockRejectedValue(
      Object.assign(new Error("The operation was aborted."), { name: "AbortError" }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await enviarWhatsAppTexto({ telefone: "21999999999", mensagem: "Olá" });

    expect(resultado).toEqual({
      attempted: true,
      sent: false,
      error: "Tempo limite ao chamar a Evolution API.",
    });
  });
});

describe("consultarStatusConexaoWhatsApp", () => {
  beforeEach(() => {
    process.env = { ...ambienteOriginal };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    vi.restoreAllMocks();
  });

  it("retorna configured: false quando as variáveis não estão presentes", async () => {
    delete process.env.EVOLUTION_API_URL;
    delete process.env.EVOLUTION_API_KEY;
    delete process.env.EVOLUTION_INSTANCE;

    await expect(consultarStatusConexaoWhatsApp()).resolves.toEqual({
      configured: false,
      connected: false,
      instance: null,
    });
  });

  it("retorna connected: true quando a instância está com estado 'open'", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ instance: { instanceName: "clinica", state: "open" } }), {
        status: 200,
      }),
    );

    await expect(consultarStatusConexaoWhatsApp()).resolves.toEqual({
      configured: true,
      connected: true,
      instance: "clinica",
    });
  });

  it("retorna connected: false sem lançar quando a chamada falha", async () => {
    configurarAmbiente();
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("rede indisponível"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await consultarStatusConexaoWhatsApp();

    expect(resultado.configured).toBe(true);
    expect(resultado.connected).toBe(false);
    expect(resultado.error).toBeTruthy();
  });
});
