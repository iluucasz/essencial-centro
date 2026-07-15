"use client";

import { useActionState, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { assinarDocumento, type EstadoAssinatura } from "@/modules/documentos/actions";

const estadoInicial: EstadoAssinatura = { status: "inicial" };

function posicaoNoCanvas(canvas: HTMLCanvasElement, evento: ReactPointerEvent<HTMLCanvasElement>) {
  const retangulo = canvas.getBoundingClientRect();
  const escalaX = canvas.width / retangulo.width;
  const escalaY = canvas.height / retangulo.height;

  return {
    x: (evento.clientX - retangulo.left) * escalaX,
    y: (evento.clientY - retangulo.top) * escalaY,
  };
}

export function PainelAssinatura({ documentoId }: { documentoId: string }) {
  const [state, formAction, pending] = useActionState(assinarDocumento, estadoInicial);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const desenhandoRef = useRef(false);
  const [temTraco, setTemTraco] = useState(false);

  function iniciarTraco(evento: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext("2d");
    if (!canvas || !contexto) return;

    desenhandoRef.current = true;
    const { x, y } = posicaoNoCanvas(canvas, evento);
    contexto.beginPath();
    contexto.moveTo(x, y);
  }

  function continuarTraco(evento: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext("2d");
    if (!desenhandoRef.current || !canvas || !contexto) return;

    const { x, y } = posicaoNoCanvas(canvas, evento);
    contexto.lineWidth = 2;
    contexto.lineCap = "round";
    contexto.strokeStyle = "#293630";
    contexto.lineTo(x, y);
    contexto.stroke();
    setTemTraco(true);
  }

  function finalizarTraco() {
    desenhandoRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && inputRef.current) {
      inputRef.current.value = canvas.toDataURL("image/png");
    }
  }

  function limpar() {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext("2d");
    if (canvas && contexto) {
      contexto.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (inputRef.current) inputRef.current.value = "";
    setTemTraco(false);
  }

  return (
    <form action={formAction} className="grid gap-3 print:hidden">
      <input name="id" type="hidden" value={documentoId} />
      <input ref={inputRef} name="assinaturaImagemDataUrl" type="hidden" />

      <label className="text-sm font-medium text-foreground" htmlFor="canvas-assinatura">
        Assine com o dedo ou o mouse no campo abaixo
      </label>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border border-border bg-surface"
        height={160}
        id="canvas-assinatura"
        width={600}
        onPointerDown={iniciarTraco}
        onPointerLeave={finalizarTraco}
        onPointerMove={continuarTraco}
        onPointerUp={finalizarTraco}
      />

      <button
        className="w-fit text-sm text-muted transition hover:text-foreground"
        onClick={limpar}
        type="button"
      >
        Limpar assinatura
      </button>

      <p className="text-sm text-muted">
        Ao assinar, você confirma que leu e concorda com o conteúdo acima.
      </p>

      {state.status === "erro" ? (
        <p className="text-sm font-medium text-perigo" role="alert">
          {state.mensagem}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending || !temTraco}
        type="submit"
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Confirmar e assinar
      </button>
    </form>
  );
}
