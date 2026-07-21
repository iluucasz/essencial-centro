import type { StatusAgendamento } from "./schema";

export function podeConfirmarPresenca(status: StatusAgendamento, checkinEm: Date | null) {
  return status === "marcado" && checkinEm === null;
}

export function podeConcluirAtendimento(status: StatusAgendamento, checkinEm: Date | null) {
  return status === "marcado" && checkinEm !== null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extrai o ID do agendamento de um QR de presença lido pela câmera. O QR do portal
 * (modules/agenda/components/qr-checkin.tsx) codifica a URL `/painel/checkin/{id}`; aceitamos a URL
 * completa, um caminho relativo ou o próprio UUID cru. Retorna null quando não é um QR de check-in
 * válido — a recepção pode ter apontado a câmera para qualquer outro código.
 */
export function extrairAgendamentoIdDoQr(texto: string): string | null {
  const bruto = texto.trim();
  if (bruto === "") return null;

  if (UUID_REGEX.test(bruto)) return bruto.toLowerCase();

  const encontrado = bruto.match(/\/painel\/checkin\/([^/?#\s]+)/i)?.[1];

  return encontrado && UUID_REGEX.test(encontrado) ? encontrado.toLowerCase() : null;
}

/**
 * Usado pelo check-in biométrico (modules/biometria) — a digital identifica o cliente, não qual
 * atendimento; se ele tiver mais de um `marcado` hoje, escolhe o mais próximo do horário atual.
 * Em empate exato, mantém o primeiro encontrado (ordem de entrada, não desempate por outro campo).
 */
export function escolherAgendamentoMaisProximo<T extends { inicio: Date }>(
  candidatos: T[],
  agora: Date,
): T | null {
  if (candidatos.length === 0) return null;

  return candidatos.reduce((maisProximo, atual) =>
    Math.abs(atual.inicio.getTime() - agora.getTime()) <
    Math.abs(maisProximo.inicio.getTime() - agora.getTime())
      ? atual
      : maisProximo,
  );
}
