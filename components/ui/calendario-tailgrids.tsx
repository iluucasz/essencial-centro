"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const formatadorMesAno = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
function criarDataUtc(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes, dia));
}

function hojeIso() {
  return formatarDataIso(new Date());
}

function formatarDataIso(data: Date) {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataCurta(data: Date) {
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const ano = data.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}

function parseDataIso(valor?: string | null) {
  if (!valor) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!match) return null;

  const data = criarDataUtc(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return Number.isNaN(data.getTime()) ? null : data;
}

function adicionarMeses(data: Date, meses: number) {
  return criarDataUtc(data.getUTCFullYear(), data.getUTCMonth() + meses, 1);
}

function montarDiasDoMes(dataReferencia: Date) {
  const primeiroDia = criarDataUtc(
    dataReferencia.getUTCFullYear(),
    dataReferencia.getUTCMonth(),
    1,
  );
  const inicioGrade = criarDataUtc(
    primeiroDia.getUTCFullYear(),
    primeiroDia.getUTCMonth(),
    primeiroDia.getUTCDate() - primeiroDia.getUTCDay(),
  );

  return Array.from({ length: 42 }, (_, indice) =>
    criarDataUtc(
      inicioGrade.getUTCFullYear(),
      inicioGrade.getUTCMonth(),
      inicioGrade.getUTCDate() + indice,
    ),
  );
}

function mascaraHorario(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 4);

  if (numeros.length <= 2) return numeros;

  return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
}

function horarioValido(valor: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(valor);
  if (!match) return false;

  const hora = Number(match[1]);
  const minuto = Number(match[2]);

  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

function SeletorData({
  describedBy,
  id,
  invalido,
  onChange,
  placeholder,
  required,
  valor,
}: {
  describedBy?: string;
  id: string;
  invalido?: boolean;
  onChange: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  valor: string;
}) {
  const dataSelecionada = parseDataIso(valor);
  const [aberto, setAberto] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() => dataSelecionada ?? parseDataIso(hojeIso())!);
  const [destinoCalendario, setDestinoCalendario] = useState<HTMLElement | null>(null);
  const [posicaoCalendario, setPosicaoCalendario] = useState<{
    left: number;
    maxHeight: number;
    top: number;
    width: number;
  } | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const calendarioRef = useRef<HTMLDivElement>(null);
  const seletorRef = useRef<HTMLDivElement>(null);
  const dias = useMemo(() => montarDiasDoMes(mesVisivel), [mesVisivel]);
  const hoje = hojeIso();
  const mesAtual = mesVisivel.getUTCMonth();

  const atualizarPosicaoCalendario = useCallback(() => {
    if (typeof window === "undefined") return;

    const botao = botaoRef.current;
    if (!botao) return;

    const margem = 16;
    const espacamento = 8;
    const rect = botao.getBoundingClientRect();
    const largura = Math.min(320, Math.max(240, window.innerWidth - margem * 2));
    const left = Math.max(margem, Math.min(rect.left, window.innerWidth - largura - margem));
    const maxHeight = Math.min(380, window.innerHeight - margem * 2);
    const alturaEstimada = Math.min(360, maxHeight);
    const top = Math.max(margem, rect.top - alturaEstimada - espacamento);

    setPosicaoCalendario((atual) => {
      if (
        atual &&
        Math.abs(atual.left - left) < 1 &&
        Math.abs(atual.top - top) < 1 &&
        Math.abs(atual.width - largura) < 1 &&
        Math.abs(atual.maxHeight - maxHeight) < 1
      ) {
        return atual;
      }

      return { left, maxHeight, top, width: largura };
    });
  }, []);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(event: PointerEvent) {
      const alvo = event.target;

      if (
        alvo instanceof Node &&
        !seletorRef.current?.contains(alvo) &&
        !calendarioRef.current?.contains(alvo)
      ) {
        setAberto(false);
        setDestinoCalendario(null);
      }
    }

    function aoPressionarTecla(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
        setDestinoCalendario(null);
      }
    }

    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    window.addEventListener("resize", atualizarPosicaoCalendario);
    window.addEventListener("scroll", atualizarPosicaoCalendario, true);

    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
      window.removeEventListener("resize", atualizarPosicaoCalendario);
      window.removeEventListener("scroll", atualizarPosicaoCalendario, true);
    };
  }, [aberto, atualizarPosicaoCalendario]);

  useEffect(() => {
    if (!aberto || !posicaoCalendario?.maxHeight) return;

    const frame = window.requestAnimationFrame(() => {
      const botao = botaoRef.current;
      const calendario = calendarioRef.current;
      if (!botao || !calendario) return;

      const margem = 16;
      const espacamento = 8;
      const altura = Math.min(
        calendario.getBoundingClientRect().height,
        posicaoCalendario.maxHeight,
      );
      const top = Math.max(margem, botao.getBoundingClientRect().top - altura - espacamento);

      setPosicaoCalendario((atual) => {
        if (!atual || Math.abs(atual.top - top) < 1) return atual;

        return { ...atual, top };
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [aberto, mesVisivel, posicaoCalendario?.maxHeight]);

  function fecharCalendario() {
    setAberto(false);
    setDestinoCalendario(null);
  }

  function abrirCalendario() {
    if (typeof document !== "undefined") {
      setDestinoCalendario(
        (seletorRef.current?.closest("[data-slot='modal-dialog']") as HTMLElement | null) ??
          document.body,
      );
    }

    atualizarPosicaoCalendario();
    setAberto(true);
  }

  function alternarCalendario() {
    if (aberto) {
      fecharCalendario();
      return;
    }

    abrirCalendario();
  }

  const calendario =
    aberto && posicaoCalendario && destinoCalendario
      ? createPortal(
          <div
            className="fixed z-[1000] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-2xl"
            ref={calendarioRef}
            role="dialog"
            style={{
              left: posicaoCalendario.left,
              maxHeight: posicaoCalendario.maxHeight,
              top: posicaoCalendario.top,
              width: posicaoCalendario.width,
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-roxo/5 hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => setMesVisivel((data) => adicionarMeses(data, -1))}
                type="button"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="sr-only">Mes anterior</span>
              </button>
              <p className="text-sm font-semibold text-foreground">
                {formatadorMesAno.format(mesVisivel)}
              </p>
              <button
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-roxo/5 hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => setMesVisivel((data) => adicionarMeses(data, 1))}
                type="button"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
                <span className="sr-only">Proximo mes</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
              {diasSemana.map((dia) => (
                <span key={dia} className="py-1">
                  {dia}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {dias.map((dia) => {
                const iso = formatarDataIso(dia);
                const selecionado = iso === valor;
                const foraDoMes = dia.getUTCMonth() !== mesAtual;

                return (
                  <button
                    key={iso}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                      foraDoMes
                        ? "text-muted/60 hover:bg-roxo/5"
                        : "text-foreground hover:bg-roxo/5",
                      iso === hoje && "ring-1 ring-brand/40",
                      selecionado && "bg-brand text-brand-foreground hover:bg-brand",
                    )}
                    onClick={() => {
                      onChange(iso);
                      fecharCalendario();
                    }}
                    type="button"
                  >
                    {dia.getUTCDate()}
                  </button>
                );
              })}
            </div>
            {valor && !required ? (
              <button
                className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition hover:bg-roxo/5 hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                onClick={() => {
                  onChange("");
                  fecharCalendario();
                }}
                type="button"
              >
                Limpar data
              </button>
            ) : null}
          </div>,
          destinoCalendario,
        )
      : null;

  return (
    <div className="relative min-w-0" ref={seletorRef}>
      <button
        aria-describedby={describedBy}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm text-foreground transition hover:bg-roxo/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
          !valor && "text-muted",
          invalido && "border-perigo focus-visible:outline-perigo",
        )}
        id={id}
        onClick={alternarCalendario}
        ref={botaoRef}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-roxo" aria-hidden="true" />
          <span className={cn("truncate", dataSelecionada && "font-medium text-foreground")}>
            {dataSelecionada
              ? formatarDataCurta(dataSelecionada)
              : (placeholder ?? "Selecionar data")}
          </span>
        </span>
      </button>

      {calendario}
    </div>
  );
}

export function CampoDataCalendario({
  defaultValue,
  error,
  label,
  name,
  placeholder,
  required,
}: {
  defaultValue?: string;
  error?: string[];
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [valor, setValor] = useState(() =>
    parseDataIso(defaultValue) ? defaultValue!.slice(0, 10) : "",
  );
  const errorId = `${name}-erro`;
  const botaoId = `${name}-botao-calendario`;

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={botaoId}>
        {label}
      </label>
      <input name={name} type="hidden" value={valor} />
      <SeletorData
        describedBy={error?.length ? errorId : undefined}
        id={botaoId}
        invalido={Boolean(error?.length)}
        onChange={setValor}
        placeholder={placeholder}
        required={required}
        valor={valor}
      />
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function CampoDataHoraCalendario({
  dataInicial,
  error,
  horarioInicial = "09:00",
  label,
  name,
}: {
  dataInicial?: string;
  error?: string[];
  horarioInicial?: string;
  label: string;
  name: string;
}) {
  const [data, setData] = useState(() => {
    const normalizada = parseDataIso(dataInicial);

    return normalizada ? formatarDataIso(normalizada) : hojeIso();
  });
  const [horario, setHorario] = useState(() =>
    horarioValido(horarioInicial) ? horarioInicial : "09:00",
  );
  const errorId = `${name}-erro`;
  const botaoId = `${name}-botao-calendario`;
  const horarioId = `${name}-horario`;
  const valorOculto = data && horarioValido(horario) ? `${data}T${horario}` : "";

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={botaoId}>
        {label}
      </label>
      <input name={name} type="hidden" value={valorOculto} />
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(13rem,1fr)_9rem]">
        <SeletorData
          describedBy={error?.length ? errorId : undefined}
          id={botaoId}
          invalido={Boolean(error?.length)}
          onChange={setData}
          required
          valor={data}
        />
        <div className="relative min-w-0">
          <Clock3
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-roxo"
            aria-hidden="true"
          />
          <input
            aria-describedby={error?.length ? errorId : undefined}
            aria-invalid={error?.length || !horarioValido(horario) ? true : undefined}
            className={cn(
              "h-11 w-full min-w-0 rounded-xl border border-border bg-surface pr-3 pl-9 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20",
              !horarioValido(horario) && "border-perigo focus:border-perigo focus:ring-perigo/20",
            )}
            id={horarioId}
            inputMode="numeric"
            maxLength={5}
            onChange={(event) => setHorario(mascaraHorario(event.target.value))}
            placeholder="09:00"
            value={horario}
          />
        </div>
      </div>
      {error?.length ? (
        <p className="text-sm text-perigo" id={errorId}>
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}
