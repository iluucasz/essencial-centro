"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { ArrowRight, Camera, CheckCircle2, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { confirmarPresencaAgendamento } from "@/modules/agenda/actions";
import { extrairAgendamentoIdDoQr } from "@/modules/agenda/checkin";

type Estado =
  | { tipo: "parado" }
  | { tipo: "lendo" }
  | { tipo: "confirmando" }
  | { tipo: "confirmado" }
  | { tipo: "erro-camera" }
  | { tipo: "erro-confirmacao"; mensagem: string }
  | { tipo: "outro-agendamento"; agendamentoId: string }
  | { tipo: "nao-reconhecido" };

/**
 * Lê o QR de presença do cliente pela câmera e confirma o check-in do agendamento atual. O QR
 * codifica a URL `/painel/checkin/{id}` (ver qr-checkin.tsx); só confirma se o ID lido bater com o
 * agendamento aberto — se for de outro, oferece o link em vez de confirmar o errado. É um reforço à
 * confirmação manual (o botão continua na página, funciona sem câmera/JS).
 */
export function LeitorQrPresenca({
  agendamentoId,
  mostrarLinkOutroAgendamento = true,
  onConfirmado,
}: {
  agendamentoId: string;
  mostrarLinkOutroAgendamento?: boolean;
  onConfirmado?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });
  const [, iniciarTransicao] = useTransition();
  const router = useRouter();

  const pararCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const processarLeitura = useCallback(
    (texto: string) => {
      const idLido = extrairAgendamentoIdDoQr(texto);
      if (!idLido) {
        pararCamera();
        setEstado({ tipo: "nao-reconhecido" });
        return;
      }

      pararCamera();

      if (idLido !== agendamentoId) {
        setEstado({ tipo: "outro-agendamento", agendamentoId: idLido });
        return;
      }

      setEstado({ tipo: "confirmando" });
      iniciarTransicao(async () => {
        const formData = new FormData();
        formData.set("id", agendamentoId);
        const resultado = await confirmarPresencaAgendamento({ status: "inicial" }, formData);

        if (resultado.status === "erro") {
          setEstado({
            tipo: "erro-confirmacao",
            mensagem: resultado.mensagem ?? "Não foi possível confirmar a presença.",
          });
          router.refresh();
          return;
        }

        setEstado({ tipo: "confirmado" });
        router.refresh();
        onConfirmado?.();
      });
    },
    [agendamentoId, onConfirmado, pararCamera, router],
  );

  useEffect(() => {
    if (estado.tipo !== "lendo") return;

    let cancelado = false;
    const leitor = new BrowserQRCodeReader();

    leitor
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (resultado) => {
        if (resultado) processarLeitura(resultado.getText());
      })
      .then((controls) => {
        if (cancelado) controls.stop();
        else controlsRef.current = controls;
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro-camera" });
      });

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [estado.tipo, processarLeitura]);

  useEffect(() => () => pararCamera(), [pararCamera]);

  if (estado.tipo === "confirmando" || estado.tipo === "confirmado") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand/25 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
        {estado.tipo === "confirmando" ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Confirmando presença…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Presença confirmada pela leitura do QR.
          </>
        )}
      </div>
    );
  }

  if (estado.tipo === "lendo") {
    return (
      <div className="grid gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-black">
          {/* stream de câmera ao vivo, sem faixa de legenda aplicável */}
          <video ref={videoRef} className="size-full object-cover" autoPlay muted playsInline />
          <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/70" />
        </div>
        <p className="text-center text-sm text-muted">
          Aponte a câmera para o QR de presença que o cliente mostra no portal.
        </p>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={() => {
            pararCamera();
            setEstado({ tipo: "parado" });
          }}
          type="button"
        >
          <X className="size-4" aria-hidden="true" />
          Cancelar leitura
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => setEstado({ tipo: "lendo" })}
        type="button"
      >
        <Camera className="size-4" aria-hidden="true" />
        Ler QR do cliente
      </button>

      {estado.tipo === "erro-camera" ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          Não foi possível acessar a câmera. Verifique a permissão do navegador e tente de novo.
        </p>
      ) : null}

      {estado.tipo === "nao-reconhecido" ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-dourado/10 px-3 py-2 text-sm font-medium text-dourado"
          role="alert"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          QR não reconhecido. Use o QR de presença do portal do cliente.
        </p>
      ) : null}

      {estado.tipo === "erro-confirmacao" ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {estado.mensagem}
        </p>
      ) : null}

      {estado.tipo === "outro-agendamento" ? (
        <div
          className="grid gap-2 rounded-lg bg-dourado/10 px-3 py-2 text-sm font-medium text-dourado"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            Esse QR é de outro agendamento.
          </span>
          {mostrarLinkOutroAgendamento ? (
            <Link
              className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-roxo transition hover:bg-creme"
              href={`/painel/checkin/${estado.agendamentoId}`}
            >
              Abrir o check-in desse agendamento
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
