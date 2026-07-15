import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enviarEmailNotificacao } from "./email";

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

    await enviarEmailNotificacao({
      destinatarioEmail: "cliente@example.com",
      destinatarioNome: "Cliente",
      titulo: "Título",
      mensagem: "Mensagem",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia pra API da Brevo com o corpo esperado quando configurada", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ messageId: "123" }), { status: 201 }));

    await enviarEmailNotificacao({
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
  });

  it("não lança quando a chamada falha — só registra o erro", async () => {
    process.env.BREVO_API_KEY = "chave-teste";
    process.env.BREVO_SENDER_EMAIL = "contato@essencialcentro.com";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("rede indisponível"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      enviarEmailNotificacao({
        destinatarioEmail: "cliente@example.com",
        destinatarioNome: "Cliente",
        titulo: "Título",
        mensagem: "Mensagem",
      }),
    ).resolves.toBeUndefined();
  });
});
