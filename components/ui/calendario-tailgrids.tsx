"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const formatadorMesAno = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "UTC",
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
  const dias = useMemo(() => montarDiasDoMes(mesVisivel), [mesVisivel]);
  const hoje = hojeIso();
  const mesAtual = mesVisivel.getUTCMonth();

  return (
    <div className="relative">
      <button
        aria-describedby={describedBy}
        aria-expanded={aberto}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 text-left text-sm text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
          !valor && "text-muted",
          invalido && "border-perigo focus-visible:outline-perigo",
        )}
        id={id}
        onClick={() => setAberto((atual) => !atual)}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-roxo" aria-hidden="true" />
          <span className="truncate">
            {dataSelecionada
              ? formatadorData.format(dataSelecionada)
              : (placeholder ?? "Selecionar data")}
          </span>
        </span>
      </button>

      {aberto ? (
        <div className="absolute z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-3 shadow-md">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => setMesVisivel((data) => adicionarMeses(data, -1))}
              type="button"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">Mês anterior</span>
            </button>
            <p className="text-sm font-semibold text-foreground">
              {formatadorMesAno.format(mesVisivel)}
            </p>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => setMesVisivel((data) => adicionarMeses(data, 1))}
              type="button"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">Próximo mês</span>
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
                    "flex aspect-square items-center justify-center rounded-lg text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                    foraDoMes ? "text-muted/60 hover:bg-creme" : "text-foreground hover:bg-creme",
                    iso === hoje && "ring-1 ring-brand/40",
                    selecionado && "bg-brand text-brand-foreground hover:bg-brand",
                  )}
                  onClick={() => {
                    onChange(iso);
                    setAberto(false);
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
              className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => {
                onChange("");
                setAberto(false);
              }}
              type="button"
            >
              Limpar data
            </button>
          ) : null}
        </div>
      ) : null}
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
    <div className="grid gap-2">
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
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={botaoId}>
        {label}
      </label>
      <input name={name} type="hidden" value={valorOculto} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <SeletorData
          describedBy={error?.length ? errorId : undefined}
          id={botaoId}
          invalido={Boolean(error?.length)}
          onChange={setData}
          required
          valor={data}
        />
        <div className="relative">
          <Clock3
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-roxo"
            aria-hidden="true"
          />
          <input
            aria-describedby={error?.length ? errorId : undefined}
            aria-invalid={error?.length || !horarioValido(horario) ? true : undefined}
            className={cn(
              "h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20",
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
