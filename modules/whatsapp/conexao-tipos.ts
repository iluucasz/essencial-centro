/**
 * Tipos e helpers puros da conexão do número de WhatsApp (Evolution API) — sem dependência de
 * servidor, então servem tanto pra rota/serviço quanto pro cartão client-side. O contrato JSON da
 * nossa API (`/api/whatsapp/instance`) fica em inglês de propósito: é o formato combinado na
 * especificação da integração.
 */

/** Estados gravados no banco. `not_created` não é gravado — é a ausência de instância. */
export const estadosConexaoWhatsApp = [
  "connected",
  "connecting",
  "disconnected",
  "unknown",
] as const;
export type EstadoConexaoGravado = (typeof estadosConexaoWhatsApp)[number];
export type EstadoConexaoWhatsApp = EstadoConexaoGravado | "not_created";

export type QrCodeWhatsApp = {
  /** Sempre um data URI (`data:image/png;base64,...`), pronto pro `src` de um `<img>`. */
  base64: string;
  /** Código de 8 caracteres pra "conectar com número de telefone", quando a Evolution manda. */
  pairingCode: string | null;
};

export type StatusConexaoWhatsApp = {
  serverConfigured: boolean;
  instanceName: string | null;
  created: boolean;
  state: EstadoConexaoWhatsApp;
  number: string | null;
  profileName: string | null;
  error: string | null;
};

export type RespostaCriarConexao = { status: StatusConexaoWhatsApp; qr: QrCodeWhatsApp | null };

export type RespostaQrCode =
  { connected: true; qr: null } | { connected: false; qr: QrCodeWhatsApp };

export const MENSAGEM_WHATSAPP_INDISPONIVEL = "O WhatsApp ainda não está disponível";

/** `open` → conectado; `connecting` → esperando a leitura do QR; `close`/`closed` → desconectado. */
export function mapearEstadoEvolution(estado: string | null | undefined): EstadoConexaoGravado {
  switch (estado) {
    case "open":
      return "connected";
    case "connecting":
      return "connecting";
    case "close":
    case "closed":
      return "disconnected";
    default:
      return "unknown";
  }
}

export const rotulosEstadoConexao: Record<EstadoConexaoWhatsApp, string> = {
  connected: "Conectado",
  connecting: "Aguardando leitura do QR Code",
  disconnected: "Desconectado",
  unknown: "Status indisponível",
  not_created: "Nenhum número conectado",
};

/** `5511987654321` → `+55 (11) 98765-4321`. Formato fora do padrão brasileiro volta como veio. */
export function formatarNumeroWhatsApp(numero: string) {
  const correspondencia = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(numero);
  if (!correspondencia) return `+${numero}`;

  const [, ddd, inicio, fim] = correspondencia;
  return `+55 (${ddd}) ${inicio}-${fim}`;
}
