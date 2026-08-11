import { z } from "zod";

import type { StatusAgendamento } from "./schema";

/**
 * Confirmação do contrato pelo cliente, por link no WhatsApp.
 *
 * O agendamento nasce `aguardando_confirmacao`. A clínica manda a lista completa das sessões com um
 * link tokenizado; o cliente abre, confere as datas e responde. Aceite leva tudo pra `marcado`,
 * recusa leva pra `recusado` — e aí é a clínica que remarca.
 *
 * Optamos por link em vez de interpretar "sim"/"não" na conversa: texto livre erra ("ss", "confirmo",
 * áudio, emoji), não diz QUAL contrato quando há dois pendentes, e exigiria webhook configurado na
 * instância da Evolution. O link também deixa registro de quando o cliente respondeu.
 *
 * Tudo aqui é função pura pra ser testável sem banco nem WhatsApp.
 */

/** Prazo do link. Curto de propósito: data de sessão envelhece rápido. */
export const DIAS_VALIDADE_TOKEN_CONFIRMACAO = 7;

/*
  Web Crypto em vez de `node:crypto`: as funções de formatação daqui (`descreverSessao`) também rodam
  no componente cliente da página de confirmação, e um import de `node:crypto` no topo quebraria o
  bundle do navegador. `crypto.getRandomValues` é global no Node 18+, no edge e no browser.
*/
export function gerarTokenConfirmacao(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let binario = "";

  for (const byte of bytes) binario += String.fromCharCode(byte);

  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function expiracaoTokenConfirmacao(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DIAS_VALIDADE_TOKEN_CONFIRMACAO * 24 * 60 * 60 * 1000);
}

export function tokenConfirmacaoExpirado(
  expiraEm: Date | null | undefined,
  agora: Date = new Date(),
): boolean {
  return !expiraEm || expiraEm.getTime() <= agora.getTime();
}

/** Status em que o contrato ainda está esperando resposta do cliente. */
export const STATUS_INICIAL_AGENDAMENTO: StatusAgendamento = "aguardando_confirmacao";

export type SituacaoConfirmacao =
  | { estado: "pendente" }
  | { estado: "confirmado"; em: Date }
  | { estado: "recusado"; em: Date }
  | { estado: "expirado" }
  | { estado: "invalido" };

/**
 * O que o link deve mostrar. Confirmado/recusado vêm ANTES de expirado de propósito: quem já
 * respondeu e revisita o link precisa ver a própria resposta, não "link expirado".
 */
export function situacaoDoContrato({
  tokenConfirmacao,
  tokenExpiraEm,
  confirmadoEm,
  recusadoEm,
  agora = new Date(),
}: {
  tokenConfirmacao: string | null;
  tokenExpiraEm: Date | null;
  confirmadoEm: Date | null;
  recusadoEm: Date | null;
  agora?: Date;
}): SituacaoConfirmacao {
  if (!tokenConfirmacao) return { estado: "invalido" };
  if (confirmadoEm) return { estado: "confirmado", em: confirmadoEm };
  if (recusadoEm) return { estado: "recusado", em: recusadoEm };
  if (tokenConfirmacaoExpirado(tokenExpiraEm, agora)) return { estado: "expirado" };

  return { estado: "pendente" };
}

export function podeResponder(situacao: SituacaoConfirmacao) {
  return situacao.estado === "pendente";
}

export type SessaoParaConfirmar = { inicio: Date; duracaoMinutos: number };

/*
  Três formatadores separados em vez de um só: pedindo `weekday` junto de `day`/`month`, o Intl monta
  "ter., 04/08" — e essa pontuação muda com a versão do ICU do Node. Mensagem que vai pro cliente não
  pode variar por atualização de runtime, então o formato é composto aqui.

  `timeZone: "UTC"` NÃO é descuido: `agendamento.inicio` guarda horário de PAREDE nos campos UTC do
  Date (ver `interpretarDataHoraParede` em schema.ts). Formatar em "America/Sao_Paulo" subtrairia 3h
  e a mensagem mandaria o cliente no horário errado. Mesma convenção de `mensagem-notificacao.ts`.
*/
const formatadorDiaSemana = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "short",
});

const formatadorDiaMes = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "ter 04/08 às 14:00" — o dia da semana entra porque é por ele que a pessoa confere de verdade. */
export function descreverSessao(sessao: SessaoParaConfirmar) {
  const diaSemana = formatadorDiaSemana.format(sessao.inicio).replace(/\.$/, "");

  return `${diaSemana} ${formatadorDiaMes.format(sessao.inicio)} às ${formatadorHora.format(sessao.inicio)}`;
}

/** Mesma descrição, numerada a partir de 1 para a lista da mensagem. */
export function linhaDaSessao(sessao: SessaoParaConfirmar, indice: number) {
  return `${indice + 1}. ${descreverSessao(sessao)}`;
}

/**
 * Mensagem de pedido de confirmação. Lista TODAS as sessões: a pergunta é "as datas estão certas?",
 * e sem a lista completa o cliente não tem como responder isso.
 */
export function mensagemPedidoConfirmacao({
  primeiroNome,
  servicoNome,
  sessoes,
  url,
}: {
  primeiroNome: string;
  servicoNome: string;
  sessoes: SessaoParaConfirmar[];
  url: string;
}) {
  const total = sessoes.length;
  const duracao = sessoes[0]?.duracaoMinutos;

  return [
    `Olá, ${primeiroNome}! Agendamos ${total === 1 ? "seu atendimento" : `suas ${total} sessões`} de ${servicoNome}${duracao ? ` (${duracao} min cada)` : ""}:`,
    "",
    ...sessoes.map(linhaDaSessao),
    "",
    total === 1 ? "Confira a data e confirme por aqui:" : "Confira as datas e confirme por aqui:",
    url,
    "",
    "Se algum horário não servir, é só recusar no link que a gente remarca.",
  ].join("\n");
}

/**
 * Resposta ao aceite. Diz o que vai acontecer depois — lembrete um dia antes e, no dia, o QR de
 * presença — porque foi isso que a clínica prometeu ao pedir a confirmação.
 */
export function mensagemConfirmadoComSucesso({
  primeiroNome,
  sessoes,
}: {
  primeiroNome: string;
  sessoes: SessaoParaConfirmar[];
}) {
  const proxima = sessoes[0];

  return [
    `Confirmado com sucesso, ${primeiroNome}! Seus horários estão reservados.`,
    proxima ? `Seu próximo atendimento é ${descreverSessao(proxima)}.` : null,
    "",
    "A partir de agora:",
    "- Avisamos você 1 dia antes de cada sessão.",
    "- No dia, enviamos seu QR Code de presença aqui mesmo.",
    "- Basta apresentar o QR Code na recepção quando chegar.",
  ]
    .filter((linha) => linha !== null)
    .join("\n");
}

/** Resposta à recusa. Sem cobrança: quem recusou precisa saber que a clínica vai procurá-lo. */
export function mensagemRecusaRegistrada(primeiroNome: string) {
  return [
    `Tudo bem, ${primeiroNome} — registramos que essas datas não servem.`,
    "",
    "A clínica vai entrar em contato para remarcar em um horário melhor para você.",
  ].join("\n");
}

/**
 * Mensagem do dia do atendimento, com o link do QR de presença. Sem "Bom dia": o lembrete dispara 3h
 * antes da sessão, então numa sessão à tarde a saudação sairia errada.
 */
export function mensagemQrDoDia({
  primeiroNome,
  hora,
  urlQr,
}: {
  primeiroNome: string;
  hora: string;
  urlQr: string;
}) {
  return [
    `Olá, ${primeiroNome}! Seu atendimento é hoje às ${hora}.`,
    "",
    "Apresente este QR Code na recepção quando chegar:",
    urlQr,
  ].join("\n");
}

/**
 * Validação da resposta do cliente ao link (`responderConfirmacao`). `motivo` só existe no DOM
 * quando a pessoa escolhe "recusar" (o textarea some ao confirmar direto — ver
 * `formulario-confirmacao.tsx`), então `formData.get("motivo")` vem `null`, não `""`. `.optional()`
 * do Zod só aceita `undefined` — sem tratar `null` aqui, TODA confirmação falhava com um erro
 * genérico, mesmo com token e resposta válidos. Por isso o preprocess trata `!== "string"` (cobre
 * `null`), não só string vazia.
 */
export const responderConfirmacaoSchema = z.object({
  token: z.string().min(1),
  resposta: z.enum(["confirmar", "recusar"]),
  motivo: z.preprocess(
    (valor) => (typeof valor !== "string" || valor.trim() === "" ? undefined : valor),
    z.string().trim().max(500).optional(),
  ),
});
