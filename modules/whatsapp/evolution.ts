import type { QrCodeWhatsApp } from "./conexao-tipos";

/**
 * Cliente mínimo da Evolution API (v2, tolerando respostas da v1) pra CONEXÃO do número — criar a
 * instância, ler QR Code, consultar estado e desconectar. Envio de mensagem fica em
 * `modules/notificacoes/whatsapp.ts`. Sem SDK, só `fetch`. Nenhuma função lança: tudo volta como
 * `{ ok, error }` com mensagem legível — quem decide o status HTTP é o serviço (`conexao.ts`).
 *
 * `EVOLUTION_API_KEY` é a chave GLOBAL do servidor — só existe aqui, no back-end; o navegador fala
 * apenas com `/api/whatsapp/instance`.
 */

const TIMEOUT_MS = 10_000;

export type ConfiguracaoEvolution = { apiUrl: string; apiKey: string };

export function lerConfiguracaoEvolution(): ConfiguracaoEvolution | null {
  const apiUrl = process.env.EVOLUTION_API_URL?.trim();
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();
  if (!apiUrl || !apiKey) return null;

  // Sem tirar a barra final, `https://host/` vira `https://host//instance/...` e a Evolution
  // responde 404 — indistinguível de "instância não existe".
  return { apiUrl: apiUrl.replace(/\/+$/, ""), apiKey };
}

type Falha = { ok: false; error: string };

type RespostaHttp = { ok: true; json: unknown } | (Falha & { status?: number });

async function chamarEvolution(
  config: ConfiguracaoEvolution,
  metodo: "GET" | "POST" | "DELETE",
  caminho: string,
  corpo?: unknown,
): Promise<RespostaHttp> {
  const controlador = new AbortController();
  const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${config.apiUrl}${caminho}`, {
      method: metodo,
      headers: { apikey: config.apiKey, "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: controlador.signal,
      cache: "no-store",
    });
    const texto = await resposta.text().catch(() => "");

    if (!resposta.ok) {
      return {
        ok: false,
        status: resposta.status,
        error: `Evolution API respondeu ${resposta.status}: ${texto.slice(0, 200)}`,
      };
    }

    return { ok: true, json: lerJson(texto) };
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: timeout ? "Tempo limite ao chamar a Evolution API" : "Erro ao chamar a Evolution API",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function lerJson(texto: string): unknown {
  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

type Objeto = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown) {
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

/** QR Code em `qrcode.base64` (criação, v2) ou `base64` (connect); garante o prefixo `data:`. */
export function extrairQrCode(dados: unknown): QrCodeWhatsApp | null {
  if (!ehObjeto(dados)) return null;

  const qrcode = ehObjeto(dados.qrcode) ? dados.qrcode : {};
  const base64 = texto(qrcode.base64) ?? texto(dados.base64);
  if (!base64) return null;

  return {
    base64: base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`,
    pairingCode: texto(qrcode.pairingCode) ?? texto(dados.pairingCode),
  };
}

export type InstanciaEvolution = {
  /** Estado bruto da Evolution (`open`, `connecting`, `close`...) — mapear com `mapearEstadoEvolution`. */
  estado: string | null;
  numero: string | null;
  nomePerfil: string | null;
};

/** `5511987654321:12@s.whatsapp.net` → `5511987654321`. */
function extrairNumero(jid: string | null) {
  if (!jid) return null;

  const digitos = jid.split("@")[0].split(":")[0].replace(/\D/g, "");
  return digitos || null;
}

/**
 * `fetchInstances` volta array ou objeto, e cada item pode vir aninhado em `.instance` (v1) —
 * achata tudo e procura pelo nome, já que alguns servidores ignoram o filtro da query string.
 */
export function localizarInstancia(dados: unknown, nome: string): InstanciaEvolution | null {
  const itens = Array.isArray(dados) ? dados : [dados];
  const item = itens
    .filter(ehObjeto)
    .map((bruto) => ({ ...bruto, ...(ehObjeto(bruto.instance) ? bruto.instance : {}) }))
    .find((achatado) => achatado.name === nome || achatado.instanceName === nome);

  if (!item) return null;

  return {
    estado: texto(item.connectionStatus) ?? texto(item.status) ?? texto(item.state),
    numero: extrairNumero(texto(item.ownerJid) ?? texto(item.owner)),
    nomePerfil: texto(item.profileName),
  };
}

function caminhoInstancia(acao: string, nome: string) {
  return `/instance/${acao}/${encodeURIComponent(nome)}`;
}

/** `instancia: null` = não existe no servidor (404 ou lista sem ela). */
export async function consultarInstancia(
  config: ConfiguracaoEvolution,
  nome: string,
): Promise<{ ok: true; instancia: InstanciaEvolution | null } | Falha> {
  const resposta = await chamarEvolution(
    config,
    "GET",
    `/instance/fetchInstances?instanceName=${encodeURIComponent(nome)}`,
  );

  if (!resposta.ok) {
    return resposta.status === 404 ? { ok: true, instancia: null } : falha(resposta);
  }

  return { ok: true, instancia: localizarInstancia(resposta.json, nome) };
}

/** A resposta da criação já costuma trazer o primeiro QR Code. */
export async function criarInstancia(
  config: ConfiguracaoEvolution,
  nome: string,
): Promise<{ ok: true; qr: QrCodeWhatsApp | null } | Falha> {
  const resposta = await chamarEvolution(config, "POST", "/instance/create", {
    instanceName: nome,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
  });

  return resposta.ok ? { ok: true, qr: extrairQrCode(resposta.json) } : falha(resposta);
}

/** QR Code novo. Se o número já está conectado (`instance.state === "open"`), não há QR. */
export async function buscarQrCode(
  config: ConfiguracaoEvolution,
  nome: string,
): Promise<{ ok: true; conectado: boolean; qr: QrCodeWhatsApp | null } | Falha> {
  const resposta = await chamarEvolution(config, "GET", caminhoInstancia("connect", nome));
  if (!resposta.ok) return falha(resposta);

  const dados = resposta.json;
  const conectado = ehObjeto(dados) && ehObjeto(dados.instance) && dados.instance.state === "open";

  return { ok: true, conectado, qr: conectado ? null : extrairQrCode(dados) };
}

/** Desconecta o número; a instância continua existindo, pronta pra um novo QR Code. */
export async function desconectarInstancia(
  config: ConfiguracaoEvolution,
  nome: string,
): Promise<{ ok: true } | Falha> {
  const resposta = await chamarEvolution(config, "DELETE", caminhoInstancia("logout", nome));

  return resposta.ok ? { ok: true } : falha(resposta);
}

function falha(resposta: Falha): Falha {
  return { ok: false, error: resposta.error };
}
