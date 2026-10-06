import { randomBytes } from "node:crypto";

/**
 * Link de autocadastro enviado por WhatsApp. Token aleatório forte e inadivinhável, com expiração;
 * o uso único é garantido pelo status do convite. Lógica pura/testável — a URL absoluta fica em
 * url-publica.ts (depende de `headers()`), server-only.
 */
export const DIAS_VALIDADE_CONVITE_CADASTRO = 14;

export function gerarTokenConvite(): string {
  return randomBytes(32).toString("base64url");
}

export function expiracaoConvite(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + DIAS_VALIDADE_CONVITE_CADASTRO * 24 * 60 * 60 * 1000);
}

export function conviteExpirado(expiraEm: Date | null, agora: Date = new Date()): boolean {
  return !expiraEm || expiraEm.getTime() <= agora.getTime();
}

export function mensagemConviteWhatsApp(url: string) {
  return (
    `Olá! 💜\n\n` +
    `Para agilizar seu atendimento na Essencial Centro, preencha seu cadastro ` +
    `neste link seguro:\n${url}\n\n` +
    `É rápido e leva poucos minutos. Qualquer dúvida, é só chamar por aqui!`
  );
}
