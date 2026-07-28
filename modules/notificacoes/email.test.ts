import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enviarEmailNotificacao, urlBaseNotificacoes } from "./email";

const ambienteOriginal = { ...process.env };

describe("enviarEmailNotificacao", () => {
  beforeEach(() => {
    process.env = { ...ambienteOriginal };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
    vi.restoreAllMocks();
  });

  it("não chama a API quando a Brevo não está configurada", async () => {
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
    const fetchMock = vi.spyOn(global, "fetch");

    const resultado = await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Título",
      mensagem: "Mensagem",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(resultado).toEqual({ attempted: false, sent: false, error: null });
  });

  it("envia pra API da Brevo com o corpo esperado quando configurada", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ messageId: "123" }), { status: 201 }));

    const resultado = await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Lembrete: atendimento amanhã",
      mensagem: "Seu atendimento é amanhã às 10h.",
      link: "/portal/agendamentos",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opcoes] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(opcoes?.method).toBe("POST");
    expect((opcoes?.headers as Record<string, string>)["api-key"]).toBe("chave-teste");

    const corpo = JSON.parse(opcoes?.body as string);
    expect(corpo.sender.email).toBe("contato@essencialcentro.com");
    expect(corpo.to).toEqual([{ email: "cliente@example.com", name: "Cliente" }]);
    expect(corpo.subject).toBe("Lembrete: atendimento amanhã");
    expect(corpo.htmlContent).toContain("/portal/agendamentos");
    expect(resultado).toEqual({ attempted: true, sent: true, error: null });
  });

  it("retorna erro estruturado quando a Brevo responde com falha, sem lançar", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("Unauthorized", { status: 401 }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Título",
      mensagem: "Mensagem",
    });

    expect(resultado).toEqual({ attempted: true, sent: false, error: "Brevo respondeu 401." });
  });

  it("não lança quando a chamada falha — retorna erro estruturado", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("rede indisponível"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const resultado = await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Título",
      mensagem: "Mensagem",
    });

    expect(resultado).toEqual({
      attempted: true,
      sent: false,
      error: "Erro ao chamar a API da Brevo.",
    });
  });

  it("escapa a mensagem no HTML — nome com & ou < não quebra o corpo", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));

    await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Título",
      mensagem: "Sessão de Ana & Bia <marcada>",
    });

    const corpo = JSON.parse(fetchMock.mock.calls[0]![1]?.body as string);
    expect(corpo.htmlContent).toContain("Ana &amp; Bia &lt;marcada&gt;");
  });
});

describe("urlBaseNotificacoes", () => {
  beforeEach(() => {
    process.env = { ...ambienteOriginal };
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("usa AUTH_URL quando definida, sem barra final", () => {
    process.env.AUTH_URL = "https://essencialcentro.com/";

    expect(urlBaseNotificacoes()).toBe("https://essencialcentro.com");
  });

  it("cai no domínio de produção da Vercel quando AUTH_URL não existe", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "essencial-centro.vercel.app";
    process.env.VERCEL_URL = "deploy-abc123.vercel.app";

    expect(urlBaseNotificacoes()).toBe("https://essencial-centro.vercel.app");
  });

  it("só usa localhost quando nada indica o host — nunca em produção na Vercel", () => {
    expect(urlBaseNotificacoes()).toBe("http://localhost:3000");

    process.env.VERCEL_URL = "deploy-abc123.vercel.app";
    expect(urlBaseNotificacoes()).toBe("https://deploy-abc123.vercel.app");
  });
});
