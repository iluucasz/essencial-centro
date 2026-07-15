import { canalDesativado, type ResultadoEnvioCanal } from "./tipos";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Envio de e-mail transacional via Brevo (brevo.com) — sem SDK, só um POST direto (evita
 * dependência nova pra uma chamada única). Nunca lança: se a Brevo não estiver configurada
 * (`BREVO_API_KEY`/`BREVO_SENDER_EMAIL` ausentes) ou a chamada falhar, retorna um resultado
 * estruturado em vez de lançar — o canal in-app (`notificacao`) já cobriu a entrega, e-mail é
 * um reforço, nunca bloqueante.
 */
export async function enviarEmailNotificacao(params: {
  destinatarioEmail: string;
  destinatarioNome: string;
  titulo: string;
  mensagem: string;
  link?: string;
}): Promise<ResultadoEnvioCanal> {
  const apiKey = process.env.BREVO_API_KEY;
  const remetenteEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !remetenteEmail) return canalDesativado;

  const remetenteNome = process.env.BREVO_SENDER_NOME ?? "Essencial Centro";
  const urlBase = process.env.AUTH_URL ?? "http://localhost:3000";
  const linkCompleto = params.link ? `${urlBase}${params.link}` : undefined;

  try {
    const resposta = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: remetenteNome, email: remetenteEmail },
        to: [{ email: params.destinatarioEmail, name: params.destinatarioNome }],
        subject: params.titulo,
        htmlContent: `<p>${params.mensagem}</p>${
          linkCompleto ? `<p><a href="${linkCompleto}">Acessar no portal</a></p>` : ""
        }`,
      }),
    });

    if (!resposta.ok) {
      console.error("Falha ao enviar e-mail via Brevo:", resposta.status, await resposta.text());
      return { attempted: true, sent: false, error: `Brevo respondeu ${resposta.status}.` };
    }

    return { attempted: true, sent: true, error: null };
  } catch (error) {
    console.error("Erro ao chamar a API da Brevo:", error);
    return { attempted: true, sent: false, error: "Erro ao chamar a API da Brevo." };
  }
}
