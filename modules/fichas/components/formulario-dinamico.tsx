"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { schemaRespostasModelo, valoresIniciais, type CampoModelo } from "@/modules/fichas/campos";

export type ResultadoEnvioFicha =
  | { status: "sucesso"; id?: string }
  | { status: "erro"; mensagem: string; campos?: Record<string, string[] | undefined> };

type ServicoOpcao = { id: string; nome: string };

const classeInput =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function Rotulo({ campo }: { campo: CampoModelo }) {
  return (
    <span className="text-sm font-medium text-foreground">
      {campo.rotulo}
      {campo.obrigatorio ? <span className="text-perigo"> *</span> : null}
    </span>
  );
}

function Ajuda({ texto }: { texto?: string }) {
  if (!texto) return null;

  return <span className="text-xs text-muted">{texto}</span>;
}

/**
 * Renderiza qualquer modelo de ficha (campos em dados) como formulário RHF, validado pelo mesmo
 * schema dinâmico que a Server Action revalida. Reusado no preenchimento pela profissional e no
 * formulário público por WhatsApp (Fase 2). `servicos` só aparece no preenchimento interno.
 */
export function FormularioDinamico({
  campos,
  aoEnviar,
  valoresRespostas,
  servicos,
  servicoIdInicial = null,
  rotuloEnviar = "Salvar ficha",
  exigirConfirmacao = false,
  textoConfirmacao = "Confirmar e salvar esta ficha?",
}: {
  campos: CampoModelo[];
  aoEnviar: (dados: {
    respostas: Record<string, unknown>;
    servicoId?: string;
  }) => Promise<ResultadoEnvioFicha>;
  valoresRespostas?: Record<string, unknown>;
  servicos?: ServicoOpcao[];
  servicoIdInicial?: string | null;
  rotuloEnviar?: string;
  exigirConfirmacao?: boolean;
  textoConfirmacao?: string;
}) {
  const schema = useMemo(() => schemaRespostasModelo(campos), [campos]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: { ...valoresIniciais(campos), ...valoresRespostas },
  });
  const [servicoId, setServicoId] = useState(servicoIdInicial ?? "");
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const erroDe = (id: string) => {
    const erro = errors[id];

    return typeof erro?.message === "string" ? erro.message : null;
  };

  async function enviar(respostas: Record<string, unknown>) {
    setErroGeral(null);

    const resultado = await aoEnviar({
      respostas,
      servicoId: servicos && servicoId ? servicoId : undefined,
    });

    if (resultado.status === "erro") {
      setErroGeral(resultado.mensagem);
      for (const [campo, mensagens] of Object.entries(resultado.campos ?? {})) {
        if (mensagens?.[0]) setError(campo, { message: mensagens[0] });
      }
      setConfirmando(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(enviar)}>
      {servicos && servicos.length > 0 ? (
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Serviço (opcional)</span>
          <select
            className={classeInput}
            onChange={(evento) => setServicoId(evento.target.value)}
            value={servicoId}
          >
            <option value="">Sem serviço vinculado</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {campos.map((campo) => {
        if (campo.tipo === "secao") {
          return (
            <h3
              className="border-b border-lilas/30 pb-1 text-sm font-semibold text-roxo"
              key={campo.id}
            >
              {campo.rotulo}
            </h3>
          );
        }

        if (campo.tipo === "paragrafo") {
          return (
            <p className="text-sm leading-6 text-muted" key={campo.id}>
              {campo.rotulo}
            </p>
          );
        }

        const erro = erroDe(campo.id);

        return (
          <div className="grid gap-1.5" key={campo.id}>
            {campo.tipo === "aceite" ? (
              <label className="flex items-start gap-3 rounded-xl bg-creme p-3 text-sm text-foreground">
                <input
                  className="mt-0.5 size-4 rounded border-border text-brand focus:ring-roxo"
                  type="checkbox"
                  {...register(campo.id)}
                />
                <span>
                  <Rotulo campo={campo} />
                  <Ajuda texto={campo.ajuda} />
                </span>
              </label>
            ) : (
              <>
                <label className="grid gap-1.5">
                  <Rotulo campo={campo} />
                  <Ajuda texto={campo.ajuda} />

                  {campo.tipo === "texto_longo" ? (
                    <textarea className={cn(classeInput, "min-h-24")} {...register(campo.id)} />
                  ) : null}

                  {campo.tipo === "texto_curto" ? (
                    <input className={classeInput} type="text" {...register(campo.id)} />
                  ) : null}

                  {campo.tipo === "numero" ? (
                    <input
                      className={classeInput}
                      step="any"
                      type="number"
                      {...register(campo.id)}
                    />
                  ) : null}

                  {campo.tipo === "data" ? (
                    <input className={classeInput} type="date" {...register(campo.id)} />
                  ) : null}

                  {campo.tipo === "selecao_unica" ? (
                    <select className={classeInput} defaultValue="" {...register(campo.id)}>
                      <option value="">Selecione…</option>
                      {(campo.opcoes ?? []).map((opcao) => (
                        <option key={opcao} value={opcao}>
                          {opcao}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </label>

                {campo.tipo === "sim_nao" ? (
                  <CampoSimNao campo={campo} register={register} watch={watch} />
                ) : null}

                {campo.tipo === "selecao_multipla" ? (
                  <div className="grid gap-2 rounded-xl border border-border p-3">
                    {(campo.opcoes ?? []).map((opcao) => (
                      <label
                        className="flex items-center gap-2 text-sm text-foreground"
                        key={opcao}
                      >
                        <input
                          className="size-4 rounded border-border text-brand focus:ring-roxo"
                          type="checkbox"
                          value={opcao}
                          {...register(campo.id)}
                        />
                        {opcao}
                      </label>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            {erro ? (
              <span className="text-xs font-medium text-perigo" role="alert">
                {erro}
              </span>
            ) : null}
          </div>
        );
      })}

      {erroGeral ? (
        <p
          className="rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {erroGeral}
        </p>
      ) : null}

      {exigirConfirmacao && confirmando ? (
        <div className="grid gap-3 rounded-xl border border-roxo/20 bg-lilas/10 p-3">
          <p className="text-sm text-foreground">{textoConfirmacao}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme"
              onClick={() => setConfirmando(false)}
              type="button"
            >
              Voltar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {rotuloEnviar}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={
              exigirConfirmacao
                ? (evento) => {
                    evento.preventDefault();
                    handleSubmit(() => setConfirmando(true))();
                  }
                : undefined
            }
            type={exigirConfirmacao ? "button" : "submit"}
          >
            {isSubmitting && !exigirConfirmacao ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            {rotuloEnviar}
          </button>
        </div>
      )}
    </form>
  );
}

function CampoSimNao({
  campo,
  register,
  watch,
}: {
  campo: CampoModelo;
  register: ReturnType<typeof useForm<Record<string, unknown>>>["register"];
  watch: ReturnType<typeof useForm<Record<string, unknown>>>["watch"];
}) {
  const nomeValor = campo.detalheSeSim ? `${campo.id}.valor` : campo.id;
  const marcadoSim = Boolean(watch(nomeValor));

  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          className="size-4 rounded border-border text-brand focus:ring-roxo"
          type="checkbox"
          {...register(nomeValor)}
        />
        Sim
      </label>

      {campo.detalheSeSim && marcadoSim ? (
        <input
          className={classeInput}
          placeholder="Detalhe"
          type="text"
          {...register(`${campo.id}.detalhe`)}
        />
      ) : null}
    </div>
  );
}
