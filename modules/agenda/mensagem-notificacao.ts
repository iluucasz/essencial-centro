/**
 * Mensagens das notificações de agendamento (in-app, e-mail e WhatsApp compartilham o mesmo texto).
 * `inicio` é parede de Brasília gravada nos campos UTC (ver lib/utils) — por isso formatamos sempre
 * em UTC, senão o horário sairia deslocado.
 */
const formatadorInstante = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

export function mensagemAtendimentoMarcado(
  servicoNome: string,
  inicio: Date,
  remarcado = false,
): string {
  const quando = formatadorInstante.format(inicio);
  const verbo = remarcado ? "foi remarcado" : "está marcado";

  return (
    `Olá! Seu atendimento de ${servicoNome} ${verbo} para ${quando}. ` +
    `No dia, é só apresentar o seu QR de presença na recepção para confirmar a chegada. 💜`
  );
}

export function mensagemAtendimentoCancelado(servicoNome: string, inicio: Date): string {
  return (
    `Seu atendimento de ${servicoNome} de ${formatadorInstante.format(inicio)} foi cancelado. ` +
    `Se quiser remarcar, é só falar com a gente. 💜`
  );
}
