/** Resultado de um canal de reforço (e-mail, WhatsApp) — nunca lança, sempre retorna isto. */
export type ResultadoEnvioCanal = {
  attempted: boolean;
  sent: boolean;
  error: string | null;
};

export type ResultadoNotificacao = {
  email: ResultadoEnvioCanal;
  whatsapp: ResultadoEnvioCanal;
};

export const canalDesativado: ResultadoEnvioCanal = { attempted: false, sent: false, error: null };
