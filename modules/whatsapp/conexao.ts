import {
  MENSAGEM_WHATSAPP_INDISPONIVEL,
  mapearEstadoEvolution,
  type QrCodeWhatsApp,
  type RespostaCriarConexao,
  type RespostaQrCode,
  type StatusConexaoWhatsApp,
} from "./conexao-tipos";
import {
  atualizarConexaoWhatsApp,
  lerConexaoWhatsApp,
  limparConexaoWhatsApp,
  registrarInstanciaWhatsApp,
} from "./conexao-repositorio";
import {
  buscarQrCode,
  consultarInstancia,
  criarInstancia,
  desconectarInstancia,
  lerConfiguracaoEvolution,
  type ConfiguracaoEvolution,
} from "./evolution";
import type { ConexaoWhatsApp } from "./schema";

/**
 * Conexão do número de WhatsApp da clínica pelo painel: criar a instância na Evolution, ler QR
 * Code, acompanhar o estado e desconectar. Envio de mensagem NÃO passa por aqui.
 *
 * Nome da instância fixo e prefixado: o servidor Evolution pode ser compartilhado com outros
 * sistemas, e a clínica é uma só (sem multi-tenant).
 */
export const NOME_INSTANCIA_WHATSAPP = "essencial-centro";

/** Erro com status HTTP já decidido — a rota só repassa `{ error }` com esse status. */
export class ErroConexaoWhatsApp extends Error {
  constructor(
    message: string,
    public readonly status: 409 | 502 | 503,
  ) {
    super(message);
    this.name = "ErroConexaoWhatsApp";
  }
}

function exigirConfiguracao(): ConfiguracaoEvolution {
  const config = lerConfiguracaoEvolution();
  if (!config) throw new ErroConexaoWhatsApp(MENSAGEM_WHATSAPP_INDISPONIVEL, 503);

  return config;
}

async function exigirInstanciaGravada() {
  const registro = await lerConexaoWhatsApp();
  if (!registro) {
    throw new ErroConexaoWhatsApp(
      "Nenhum número foi conectado ainda. Use “Conectar WhatsApp” primeiro.",
      409,
    );
  }

  return registro;
}

const statusNaoCriada: StatusConexaoWhatsApp = {
  serverConfigured: true,
  instanceName: null,
  created: false,
  state: "not_created",
  number: null,
  profileName: null,
  error: null,
};

function statusDoRegistro(registro: ConexaoWhatsApp, error: string | null = null) {
  return {
    serverConfigured: true,
    instanceName: registro.nomeInstancia,
    created: true,
    state: error ? "unknown" : registro.estado,
    number: registro.numeroConectado,
    profileName: registro.nomeConectado,
    error,
  } satisfies StatusConexaoWhatsApp;
}

/**
 * Consulta o servidor e atualiza o banco. Instância removida lá → limpa aqui e volta
 * `not_created` (dá pra criar de novo). Servidor fora do ar → `unknown` com o erro, sem apagar nada.
 */
export async function obterStatusConexaoWhatsApp(): Promise<StatusConexaoWhatsApp> {
  const config = exigirConfiguracao();
  const registro = await lerConexaoWhatsApp();
  if (!registro) return statusNaoCriada;

  const consulta = await consultarInstancia(config, registro.nomeInstancia);
  if (!consulta.ok) return statusDoRegistro(registro, consulta.error);

  if (!consulta.instancia) {
    await limparConexaoWhatsApp();
    return statusNaoCriada;
  }

  const atualizado = await atualizarConexaoWhatsApp({
    estado: mapearEstadoEvolution(consulta.instancia.estado),
    numeroConectado: consulta.instancia.numero,
    nomeConectado: consulta.instancia.nomePerfil,
    verificadoEm: new Date(),
  });

  return atualizado ? statusDoRegistro(atualizado) : statusNaoCriada;
}

async function qrCodeNovo(config: ConfiguracaoEvolution, nome: string) {
  const resultado = await buscarQrCode(config, nome);
  if (!resultado.ok) throw new ErroConexaoWhatsApp(resultado.error, 502);

  return resultado;
}

/**
 * Já existe instância nossa → devolve o status e um QR novo, sem criar outra. Senão, cria — mas
 * recusa (409) se o nome já existir no servidor sem estar gravado como nosso: pode ser de outro
 * sistema, e reaproveitar seria sequestrar o número de alguém.
 */
export async function criarConexaoWhatsApp(): Promise<RespostaCriarConexao> {
  const config = exigirConfiguracao();

  if (await lerConexaoWhatsApp()) {
    const status = await obterStatusConexaoWhatsApp();

    // `not_created` aqui = a instância tinha sido removida do servidor; segue pra criar de novo.
    if (status.state !== "not_created") {
      if (status.state === "connected") return { status, qr: null };

      const { conectado, qr } = await qrCodeNovo(
        config,
        status.instanceName ?? NOME_INSTANCIA_WHATSAPP,
      );
      return conectado ? { status: await obterStatusConexaoWhatsApp(), qr: null } : { status, qr };
    }
  }

  const existente = await consultarInstancia(config, NOME_INSTANCIA_WHATSAPP);
  if (!existente.ok) throw new ErroConexaoWhatsApp(existente.error, 502);
  if (existente.instancia) {
    throw new ErroConexaoWhatsApp(
      `Já existe uma instância “${NOME_INSTANCIA_WHATSAPP}” no servidor do WhatsApp que não foi criada por este sistema. Remova-a no servidor ou fale com o suporte.`,
      409,
    );
  }

  const criada = await criarInstancia(config, NOME_INSTANCIA_WHATSAPP);
  if (!criada.ok) throw new ErroConexaoWhatsApp(criada.error, 502);

  const agora = new Date();
  const registro = await registrarInstanciaWhatsApp({
    nomeInstancia: NOME_INSTANCIA_WHATSAPP,
    instanciaCriadaEm: agora,
    estado: "connecting",
    numeroConectado: null,
    nomeConectado: null,
    verificadoEm: agora,
  });

  let qr: QrCodeWhatsApp | null = criada.qr;
  if (!qr) {
    const novo = await buscarQrCode(config, NOME_INSTANCIA_WHATSAPP);
    // Sem QR aqui não é fatal: a instância já existe e o cartão oferece "Gerar QR Code".
    qr = novo.ok ? novo.qr : null;
  }

  return { status: statusDoRegistro(registro), qr };
}

export async function gerarQrCodeWhatsApp(): Promise<RespostaQrCode> {
  const config = exigirConfiguracao();
  const registro = await exigirInstanciaGravada();

  const { conectado, qr } = await qrCodeNovo(config, registro.nomeInstancia);
  if (conectado) return { connected: true, qr: null };
  if (!qr) {
    throw new ErroConexaoWhatsApp(
      "O servidor do WhatsApp não devolveu um QR Code. Tente de novo.",
      502,
    );
  }

  return { connected: false, qr };
}

/** Logout do número. A instância continua no servidor, pronta pra um novo QR Code. */
export async function desconectarWhatsApp(): Promise<StatusConexaoWhatsApp> {
  const config = exigirConfiguracao();
  const registro = await exigirInstanciaGravada();

  const resultado = await desconectarInstancia(config, registro.nomeInstancia);
  if (!resultado.ok) throw new ErroConexaoWhatsApp(resultado.error, 502);

  const atualizado = await atualizarConexaoWhatsApp({
    estado: "disconnected",
    numeroConectado: null,
    nomeConectado: null,
    verificadoEm: new Date(),
  });

  return atualizado ? statusDoRegistro(atualizado) : statusNaoCriada;
}
