"use client";

import { useActionState, useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";

import { responderConfirmacao, type ResultadoConfirmacao } from "../confirmacao-actions";
import { descreverSessao, type SessaoParaConfirmar } from "../confirmacao";

/**
 * Confirmação/recusa do conjunto de datas. Dois botões no mesmo form, distinguidos pelo `value` do
 * submit — o cliente responde a pergunta única "as datas estão certas?" sem escolher nada antes.
 */
export function FormularioConfirmacao({
  token,
  servicoNome,
  primeiroNome,
  sessoes,
}: {
  token: string;
  servicoNome: string;
  primeiroNome: string;
  sessoes: SessaoParaConfirmar[];
}) {
  const [estado, enviar, pendente] = useActionState<ResultadoConfirmacao, FormData>(
    responderConfirmacao,
    { status: "inicial" },
  );
  const [recusando, setRecusando] = useState(false);

  if (estado.status === "confirmado") {
    return (
      <Resultado
        icone={<CheckCircle2 className="size-7" aria-hidden="true" />}
        titulo="Confirmado com sucesso!"
        tom="brand"
      >
        <p>Seus horários estão reservados. A partir de agora:</p>
        <ul className="grid gap-1 text-left">
          <li>• Avisamos você 1 dia antes de cada sessão.</li>
          <li>• No dia, enviamos seu QR Code de presença pelo WhatsApp.</li>
          <li>• Basta apresentá-lo na recepção quando chegar.</li>
        </ul>
      </Resultado>
    );
  }

  if (estado.status === "recusado") {
    return (
      <Resultado
        icone={<XCircle className="size-7" aria-hidden="true" />}
        titulo="Recusa registrada"
        tom="muted"
      >
        <p>
          Tudo bem, {primeiroNome} — registramos que essas datas não servem. A clínica vai entrar em
          contato para remarcar em um horário melhor para você.
        </p>
      </Resultado>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold text-foreground">Olá, {primeiroNome}!</h1>
        <p className="text-sm text-muted">
          Agendamos {sessoes.length === 1 ? "seu atendimento" : `suas ${sessoes.length} sessões`} de{" "}
          <span className="font-semibold text-roxo">{servicoNome}</span>. Confira{" "}
          {sessoes.length === 1 ? "a data" : "as datas"} abaixo e confirme.
        </p>
      </div>

      <ol className="grid gap-2">
        {sessoes.map((sessao, indice) => (
          <li
            key={sessao.inicio.toISOString()}
            className="flex items-center gap-3 rounded-2xl border border-border bg-creme px-4 py-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
              {indice + 1}
            </span>
            <div className="grid">
              <span className="text-sm font-semibold text-foreground">
                {descreverSessao(sessao)}
              </span>
              <span className="text-xs text-muted">{sessao.duracaoMinutos} min</span>
            </div>
          </li>
        ))}
      </ol>

      {estado.status === "erro" ? (
        <p className="flex items-start gap-2 rounded-2xl bg-perigo/10 px-4 py-3 text-sm text-perigo">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {estado.mensagem}
        </p>
      ) : null}

      <form action={enviar} className="grid gap-3">
        <input type="hidden" name="token" value={token} />

        {recusando ? (
          <div className="grid gap-2">
            <label className="grid gap-1.5 text-sm font-medium text-foreground">
              O que não serviu? (opcional)
              <textarea
                name="motivo"
                rows={3}
                maxLength={500}
                placeholder="Ex.: só consigo depois das 16h"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none"
              />
            </label>
            <button
              type="submit"
              name="resposta"
              value="recusar"
              disabled={pendente}
              className="flex items-center justify-center gap-2 rounded-full bg-perigo px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pendente ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="size-4" aria-hidden="true" />
              )}
              Enviar recusa
            </button>
            <button
              type="button"
              onClick={() => setRecusando(false)}
              className="rounded-full px-5 py-2 text-sm font-medium text-muted underline-offset-4 hover:underline"
            >
              Voltar
            </button>
          </div>
        ) : (
          <>
            <button
              type="submit"
              name="resposta"
              value="confirmar"
              disabled={pendente}
              className="flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {pendente ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CalendarCheck className="size-4" aria-hidden="true" />
              )}
              {sessoes.length === 1 ? "Confirmar atendimento" : "Confirmar todas as datas"}
            </button>
            <button
              type="button"
              onClick={() => setRecusando(true)}
              disabled={pendente}
              className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Quero remarcar
            </button>
          </>
        )}
      </form>
    </div>
  );
}

function Resultado({
  icone,
  titulo,
  tom,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  tom: "brand" | "muted";
  children: React.ReactNode;
}) {
  const cor = tom === "brand" ? "text-brand" : "text-foreground";

  return (
    <div className="grid justify-items-center gap-3 py-4 text-center">
      <span className={`flex size-14 items-center justify-center rounded-full bg-creme ${cor}`}>
        {icone}
      </span>
      <h1 className={`text-lg font-semibold ${cor}`}>{titulo}</h1>
      <div className="grid max-w-sm gap-2 text-sm text-muted">{children}</div>
    </div>
  );
}
