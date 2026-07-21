/**
 * Mensagem da notificação enviada uma única vez ao gerar a agenda do pacote (não uma por ocorrência).
 * `inicio` é parede de Brasília nos campos UTC (ver modules/agenda), por isso formatamos em UTC.
 */
const formatadorInstante = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

export function mensagemAgendaGerada(
  servicoNome: string,
  quantidade: number,
  primeiroInicio: Date,
): string {
  const plural = quantidade === 1 ? "atendimento" : "atendimentos";

  return (
    `Olá! Agendamos ${quantidade} ${plural} de ${servicoNome}, começando em ` +
    `${formatadorInstante.format(primeiroInicio)}. Você receberá um lembrete 1 dia antes de cada um. 💜`
  );
}
