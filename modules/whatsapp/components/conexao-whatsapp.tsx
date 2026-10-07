"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle, LogOut, QrCode, RefreshCw, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatarNumeroWhatsApp,
  rotulosEstadoConexao,
  type QrCodeWhatsApp,
  type RespostaCriarConexao,
  type RespostaQrCode,
  type StatusConexaoWhatsApp,
} from "@/modules/whatsapp/conexao-tipos";

const URL_INSTANCIA = "/api/whatsapp/instance";
const URL_QR_CODE = "/api/whatsapp/instance/qrcode";
const INTERVALO_STATUS_MS = 4_000;
/** A Evolution renova o QR a cada ~40 s — buscar a cada 30 s mantém sempre um válido na tela. */
const INTERVALO_QR_CODE_MS = 30_000;

type Acao = "carregar" | "conectar" | "atualizar" | "desconectar" | "gerar";

type ResultadoApi<T> = { ok: true; dados: T } | { ok: false; erro: string };

async function chamarApi<T>(url: string, metodo: "GET" | "POST" | "DELETE" = "GET") {
  try {
    const resposta = await fetch(url, { method: metodo, cache: "no-store" });
    const corpo = (await resposta.json().catch(() => null)) as { error?: string } | null;

    if (!resposta.ok) {
      return {
        ok: false,
        erro: corpo?.error ?? "Não foi possível falar com o servidor. Tente de novo.",
      } satisfies ResultadoApi<T>;
    }

    return { ok: true, dados: corpo as T } satisfies ResultadoApi<T>;
  } catch {
    return {
      ok: false,
      erro: "Sem conexão com o servidor. Tente de novo.",
    } satisfies ResultadoApi<T>;
  }
}

const classeBotaoPrincipal =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70";
const classeBotaoSecundario =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70";
const classeBotaoPerigo =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70";

function Botao({
  acao,
  carregando,
  children,
  className,
  icone,
  onClick,
}: {
  acao: Acao;
  carregando: Acao | null;
  children: ReactNode;
  className: string;
  icone: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={className} disabled={carregando !== null} onClick={onClick} type="button">
      {carregando === acao ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icone
      )}
      {children}
    </button>
  );
}

/**
 * Cartão de conexão do número de WhatsApp da clínica (Evolution API). Só conversa com a nossa API
 * — a chave da Evolution nunca chega ao navegador. Com o QR na tela, consulta o status a cada 4 s
 * (esconde o QR ao conectar) e renova o QR a cada 30 s; falha de consulta é ignorada até a próxima.
 */
export function ConexaoWhatsApp() {
  const [status, setStatus] = useState<StatusConexaoWhatsApp | null>(null);
  const [qr, setQr] = useState<QrCodeWhatsApp | null>(null);
  const [carregando, setCarregando] = useState<Acao | null>("carregar");
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoDesconexao, setConfirmandoDesconexao] = useState(false);

  useEffect(() => {
    let ativo = true;

    void chamarApi<StatusConexaoWhatsApp>(URL_INSTANCIA).then((resultado) => {
      if (!ativo) return;
      if (resultado.ok) setStatus(resultado.dados);
      else setErro(resultado.erro);
      setCarregando(null);
    });

    return () => {
      ativo = false;
    };
  }, []);

  const aguardandoLeitura = qr !== null;

  useEffect(() => {
    if (!aguardandoLeitura) return;

    let ativo = true;

    const idStatus = setInterval(async () => {
      const resultado = await chamarApi<StatusConexaoWhatsApp>(URL_INSTANCIA);
      if (!ativo || !resultado.ok) return;

      setStatus(resultado.dados);
      if (resultado.dados.state === "connected" || resultado.dados.state === "not_created") {
        setQr(null);
      }
    }, INTERVALO_STATUS_MS);

    const idQrCode = setInterval(async () => {
      const resultado = await chamarApi<RespostaQrCode>(URL_QR_CODE);
      if (!ativo || !resultado.ok) return;

      // Conectou entre duas consultas de status: o próximo tick de status já não roda (QR some).
      setQr(resultado.dados.connected ? null : resultado.dados.qr);
    }, INTERVALO_QR_CODE_MS);

    return () => {
      ativo = false;
      clearInterval(idStatus);
      clearInterval(idQrCode);
    };
  }, [aguardandoLeitura]);

  async function executar<T>(
    acao: Acao,
    url: string,
    metodo: "GET" | "POST" | "DELETE",
    aplicar: (dados: T) => void | Promise<void>,
  ) {
    setCarregando(acao);
    setErro(null);
    setConfirmandoDesconexao(false);

    const resultado = await chamarApi<T>(url, metodo);
    if (resultado.ok) await aplicar(resultado.dados);
    else setErro(resultado.erro);

    setCarregando(null);
  }

  async function atualizarStatus() {
    const resultado = await chamarApi<StatusConexaoWhatsApp>(URL_INSTANCIA);
    if (resultado.ok) setStatus(resultado.dados);
  }

  const conectar = () =>
    executar<RespostaCriarConexao>("conectar", URL_INSTANCIA, "POST", (dados) => {
      setStatus(dados.status);
      setQr(dados.status.state === "connected" ? null : dados.qr);
    });

  const atualizar = () =>
    executar<StatusConexaoWhatsApp>("atualizar", URL_INSTANCIA, "GET", (dados) => {
      setStatus(dados);
      if (dados.state === "connected" || dados.state === "not_created") setQr(null);
    });

  const desconectar = () =>
    executar<StatusConexaoWhatsApp>("desconectar", URL_INSTANCIA, "DELETE", (dados) => {
      setStatus(dados);
      setQr(null);
    });

  const gerarQrCode = () =>
    executar<RespostaQrCode>("gerar", URL_QR_CODE, "GET", async (dados) => {
      if (dados.connected) {
        setQr(null);
        await atualizarStatus();
      } else {
        setQr(dados.qr);
      }
    });

  return (
    <div className="grid gap-4">
      {status ? <LinhaEstado status={status} aguardandoLeitura={aguardandoLeitura} /> : null}

      {carregando === "carregar" ? (
        <p className="flex items-center gap-2 text-sm text-muted" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Consultando a conexão…
        </p>
      ) : null}

      {erro ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {erro}
        </p>
      ) : null}

      {qr ? <PainelQrCode qr={qr} /> : null}

      {status?.state === "connected" ? (
        <div className="grid gap-1 rounded-2xl border border-border bg-creme/40 p-4">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            Número conectado
          </p>
          <p className="text-base font-semibold text-foreground">
            {status.number ? formatarNumeroWhatsApp(status.number) : "Número não informado"}
          </p>
          {status.profileName ? <p className="text-sm text-muted">{status.profileName}</p> : null}
        </div>
      ) : null}

      {status ? (
        <div className="flex flex-wrap items-center gap-3">
          {status.state === "not_created" ? (
            <Botao
              acao="conectar"
              carregando={carregando}
              className={classeBotaoPrincipal}
              icone={<Smartphone className="size-4" aria-hidden="true" />}
              onClick={conectar}
            >
              Conectar WhatsApp
            </Botao>
          ) : null}

          {status.created && status.state !== "connected" && !qr ? (
            <Botao
              acao="gerar"
              carregando={carregando}
              className={classeBotaoPrincipal}
              icone={<QrCode className="size-4" aria-hidden="true" />}
              onClick={gerarQrCode}
            >
              Gerar QR Code
            </Botao>
          ) : null}

          {status.created ? (
            <Botao
              acao="atualizar"
              carregando={carregando}
              className={classeBotaoSecundario}
              icone={<RefreshCw className="size-4 text-roxo" aria-hidden="true" />}
              onClick={atualizar}
            >
              Atualizar
            </Botao>
          ) : null}

          {status.state === "connected" && !confirmandoDesconexao ? (
            <Botao
              acao="desconectar"
              carregando={carregando}
              className={classeBotaoSecundario}
              icone={<LogOut className="size-4 text-perigo" aria-hidden="true" />}
              onClick={() => setConfirmandoDesconexao(true)}
            >
              Desconectar
            </Botao>
          ) : null}
        </div>
      ) : null}

      {status?.state === "connected" && confirmandoDesconexao ? (
        <div
          className="grid gap-3 rounded-2xl border border-perigo/30 bg-perigo/5 p-4"
          role="alertdialog"
          aria-label="Confirmar desconexão"
        >
          <p className="text-sm text-foreground">
            Desconectar este número? As mensagens automáticas deixam de sair por ele até você ler um
            novo QR Code.
          </p>
          <div className="flex flex-wrap gap-3">
            <Botao
              acao="desconectar"
              carregando={carregando}
              className={classeBotaoPerigo}
              icone={<LogOut className="size-4" aria-hidden="true" />}
              onClick={desconectar}
            >
              Sim, desconectar
            </Botao>
            <button
              className={classeBotaoSecundario}
              disabled={carregando !== null}
              onClick={() => setConfirmandoDesconexao(false)}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LinhaEstado({
  aguardandoLeitura,
  status,
}: {
  aguardandoLeitura: boolean;
  status: StatusConexaoWhatsApp;
}) {
  const estado = aguardandoLeitura ? "connecting" : status.state;

  return (
    <div className="grid gap-1">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground" role="status">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 rounded-full",
            estado === "connected" && "bg-brand",
            estado === "connecting" && "animate-pulse bg-roxo",
            (estado === "disconnected" || estado === "not_created") && "bg-muted",
            estado === "unknown" && "bg-perigo",
          )}
        />
        {rotulosEstadoConexao[estado]}
      </p>
      {status.state === "unknown" && status.error ? (
        <p className="text-xs text-muted">{status.error}</p>
      ) : null}
    </div>
  );
}

function PainelQrCode({ qr }: { qr: QrCodeWhatsApp }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-creme/40 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URI vindo da Evolution, sem otimização de imagem aplicável */}
      <img
        alt="QR Code para conectar o WhatsApp"
        className="size-56 rounded-xl border border-border bg-white p-2"
        height={224}
        src={qr.base64}
        width={224}
      />
      <div className="grid gap-3 text-sm text-foreground">
        <ol className="grid list-decimal gap-1 pl-5">
          <li>Abra o WhatsApp no celular da clínica.</li>
          <li>
            Toque em <strong>Aparelhos conectados</strong> → <strong>Conectar um aparelho</strong>.
          </li>
          <li>Aponte a câmera para este QR Code.</li>
        </ol>
        {qr.pairingCode ? (
          <div className="grid gap-1">
            <p className="text-xs text-muted">
              Ou toque em “Conectar com número de telefone” e digite o código:
            </p>
            <p className="font-mono text-lg font-semibold tracking-[0.3em] text-roxo">
              {qr.pairingCode}
            </p>
          </div>
        ) : null}
        <p className="flex items-center gap-2 text-xs text-muted">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          Aguardando a leitura — o código se renova sozinho.
        </p>
      </div>
    </div>
  );
}
