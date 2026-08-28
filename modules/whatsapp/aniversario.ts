import { mesmoDiaCalendario } from "@/lib/utils";

/**
 * Automação de mensagem de aniversário. Tudo aqui é função pura pra ser testável sem banco nem
 * WhatsApp — mesma separação de `modules/agenda/confirmacao.ts`.
 */

function eBissexto(ano: number) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * Compara mês/dia (não ano) entre a data de nascimento e "hoje". `dataNascimento` vem de uma coluna
 * `date` pura (meia-noite UTC), por isso `getUTC*` já dá o dia certo sem conversão de fuso.
 *
 * Caso especial: quem nasceu em 29/fev não teria aniversário nenhum nos 3 anos não bissextos em
 * cada 4 — comemora em 28/fev nesses anos, senão a pessoa passaria a vida sem receber a mensagem.
 */
export function ehAniversarioHoje(dataNascimento: Date, hoje: Date): boolean {
  const mesNascimento = dataNascimento.getUTCMonth();
  const diaNascimento = dataNascimento.getUTCDate();

  if (mesNascimento === hoje.getUTCMonth() && diaNascimento === hoje.getUTCDate()) {
    return true;
  }

  const nasceuEm29DeFevereiro = mesNascimento === 1 && diaNascimento === 29;
  const hojeE28DeFevereiroEmAnoNaoBissexto =
    hoje.getUTCMonth() === 1 && hoje.getUTCDate() === 28 && !eBissexto(hoje.getUTCFullYear());

  return nasceuEm29DeFevereiro && hojeE28DeFevereiroEmAnoNaoBissexto;
}

/**
 * Decide se a checagem diária deve rodar agora — gatilho "preguiçoso" pra não depender só do cron
 * da Vercel (que só dispara em produção deployada, nunca em dev local). Chamado sempre que alguém
 * abre o painel (ver `aniversario-lazy.ts`); roda no máximo uma vez por dia de calendário em
 * Brasília, e nunca se a automação estiver desligada.
 */
export function devDispararAutomaticamente(
  configuracao: { ativo: boolean; ultimoDisparoAutomaticoEm: Date | null },
  hoje: Date,
): boolean {
  if (!configuracao.ativo) return false;
  if (!configuracao.ultimoDisparoAutomaticoEm) return true;

  return !mesmoDiaCalendario(configuracao.ultimoDisparoAutomaticoEm, hoje);
}

/**
 * Mensagem de aniversário. O brinde só aparece quando a clínica cadastrou um — sem forçar uma
 * frase genérica de presente quando não há nada a oferecer.
 */
export function mensagemAniversario({
  primeiroNome,
  brinde,
}: {
  primeiroNome: string;
  brinde?: string | null;
}): string {
  return [
    `Feliz aniversário, ${primeiroNome}! 🎉`,
    "",
    "Toda a equipe da Essencial Centro deseja um dia repleto de alegria, saúde e muito bem-estar.",
    brinde ? "" : null,
    brinde ? `Como presente, preparamos algo especial pra você: ${brinde}` : null,
    "",
    "Esperamos você em breve! 💜",
  ]
    .filter((linha) => linha !== null)
    .join("\n");
}
