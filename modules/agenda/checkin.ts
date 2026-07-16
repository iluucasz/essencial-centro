import type { StatusAgendamento } from "./schema";

export function podeConfirmarPresenca(status: StatusAgendamento, checkinEm: Date | null) {
  return status === "marcado" && checkinEm === null;
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
