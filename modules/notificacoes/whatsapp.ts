import { canalDesativado, type ResultadoEnvioCanal } from "./tipos";

const TIMEOUT_MS = 10_000;

export function configuracaoWhatsAppValida() {
  return Boolean(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_INSTANCE,
  );
}

/**
 * Normaliza um telefone brasileiro pro formato esperado pela Evolution API (só dígitos, com
 * código do país, sem `@s.whatsapp.net`). Retorna `null` quando o formato não é reconhecível.
 *
 * Cuidado: DDD 55 existe de verdade (Santa Maria/RS) — por isso a checagem usa o **tamanho** do
 * número, não só o prefixo, pra não confundir "código do país 55" com "DDD 55".
 */
export function normalizarTelefone(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;

  // Já tem código do país: 55 + DDD (2) + número (8 ou 9 dígitos) = 12 ou 13 dígitos.
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }

  // Número local (DDD + número, sem código do país) — adiciona o 55.
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }

  return null;
}

/**
 * Envio de texto via Evolution API — sem SDK, só um POST direto. Nunca lança: se as 3 variáveis
 * (`EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`EVOLUTION_INSTANCE`) não estiverem configuradas, o
 * telefone for inválido, a chamada falhar ou expirar, retorna um resultado estruturado — WhatsApp
 * é reforço do e-mail, nunca bloqueante pro fluxo principal (agendar, registrar sessão, etc.).
 */
export async function enviarWhatsAppTexto(params: {
  telefone: string;
  mensagem: string;
}): Promise<ResultadoEnvioCanal> {
  if (!configuracaoWhatsAppValida()) return canalDesativado;

  const numero = normalizarTelefone(params.telefone);
  if (!numero) {
    return { attempted: false, sent: false, error: "Telefone inválido para envio por WhatsApp." };
  }

  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;
  const instancia = process.env.EVOLUTION_INSTANCE!;

  const controlador = new AbortController();
  const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${apiUrl}/message/sendText/${encodeURIComponent(instancia)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number: numero, text: params.mensagem }),
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      console.error("Falha ao enviar WhatsApp via Evolution API:", resposta.status, corpo);
      return { attempted: true, sent: false, error: `Evolution API respondeu ${resposta.status}.` };
    }

    return { attempted: true, sent: true, error: null };
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    console.error("Erro ao enviar WhatsApp via Evolution API:", error);
    return {
      attempted: true,
      sent: false,
      error: timeout
        ? "Tempo limite ao chamar a Evolution API."
        : "Erro ao chamar a Evolution API.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Envio de imagem (ex.: QR de presença) via Evolution API (`sendMedia`). Mesma postura do
 * `enviarWhatsAppTexto`: nunca lança, é reforço não-bloqueante. `imagemBase64` é o conteúdo puro
 * (sem o prefixo `data:image/...;base64,`).
 */
export async function enviarWhatsAppImagem(params: {
  telefone: string;
  imagemBase64: string;
  legenda: string;
  nomeArquivo?: string;
}): Promise<ResultadoEnvioCanal> {
  if (!configuracaoWhatsAppValida()) return canalDesativado;

  const numero = normalizarTelefone(params.telefone);
  if (!numero) {
    return { attempted: false, sent: false, error: "Telefone inválido para envio por WhatsApp." };
  }

  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;
  const instancia = process.env.EVOLUTION_INSTANCE!;

  const controlador = new AbortController();
  const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${apiUrl}/message/sendMedia/${encodeURIComponent(instancia)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        number: numero,
        mediatype: "image",
        mimetype: "image/png",
        media: params.imagemBase64,
        fileName: params.nomeArquivo ?? "qr-presenca.png",
        caption: params.legenda,
      }),
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      console.error(
        "Falha ao enviar imagem no WhatsApp via Evolution API:",
        resposta.status,
        corpo,
      );
      return { attempted: true, sent: false, error: `Evolution API respondeu ${resposta.status}.` };
    }

    return { attempted: true, sent: true, error: null };
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    console.error("Erro ao enviar imagem no WhatsApp via Evolution API:", error);
    return {
      attempted: true,
      sent: false,
      error: timeout
        ? "Tempo limite ao chamar a Evolution API."
        : "Erro ao chamar a Evolution API.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export type StatusConexaoWhatsApp = {
  configured: boolean;
  connected: boolean;
  instance: string | null;
  error?: string;
};

/** Consulta o estado da conexão — só pra diagnóstico manual, nunca chamado continuamente. */
export async function consultarStatusConexaoWhatsApp(): Promise<StatusConexaoWhatsApp> {
  if (!configuracaoWhatsAppValida()) {
    return { configured: false, connected: false, instance: null };
  }

  const apiUrl = process.env.EVOLUTION_API_URL!;
  const apiKey = process.env.EVOLUTION_API_KEY!;
  const instancia = process.env.EVOLUTION_INSTANCE!;

  try {
    const resposta = await fetch(
      `${apiUrl}/instance/connectionState/${encodeURIComponent(instancia)}`,
      { headers: { apikey: apiKey } },
    );

    if (!resposta.ok) {
      return {
        configured: true,
        connected: false,
        instance: instancia,
        error: `Evolution API respondeu ${resposta.status}.`,
      };
    }

    const dados = (await resposta.json()) as { instance?: { state?: string } };

    return { configured: true, connected: dados.instance?.state === "open", instance: instancia };
  } catch (error) {
    console.error("Erro ao consultar status da Evolution API:", error);
    return {
      configured: true,
      connected: false,
      instance: instancia,
      error: "Erro ao consultar a Evolution API.",
    };
  }
}
