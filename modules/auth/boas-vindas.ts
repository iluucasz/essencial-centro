/**
 * Mensagem de boas-vindas enviada por WhatsApp quando o acesso ao portal é criado — junto ao
 * cadastro do cliente ou retroativamente pelo painel. Pura e sem `server-only` de propósito, pra ser
 * testável sem banco nem WhatsApp (mesma separação de `modules/agenda/confirmacao.ts`).
 */
export function mensagemBoasVindasPortal({
  primeiroNome,
  email,
  senhaProvisoria,
  url,
}: {
  primeiroNome: string;
  email: string;
  senhaProvisoria: string;
  url: string;
}): string {
  return [
    `Parabéns, ${primeiroNome}! 🎉 Seu cadastro na Essencial Centro foi feito com sucesso.`,
    "",
    "Aqui está seu acesso ao portal:",
    `E-mail: ${email}`,
    `Senha provisória: ${senhaProvisoria}`,
    "",
    `Entre por aqui: ${url}`,
    "Na primeira entrada você escolhe uma senha só sua.",
    "",
    "No portal você pode:",
    "- Ver seus próximos atendimentos e confirmar presença pelo QR Code",
    "- Acompanhar sua evolução com fotos, medidas e mapa de dor",
    "- Conferir suas sessões feitas e restantes de cada pacote",
    "- Receber lembretes automáticos antes de cada atendimento",
    "",
    "Qualquer dúvida, é só chamar por aqui. Seja bem-vindo(a)! 💜",
  ].join("\n");
}
