"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import type { z } from "zod";

import { criarFichaEsteticaCorporal, editarFichaEsteticaCorporal } from "@/modules/fichas/actions";
import {
  criarFichaEsteticaCorporalSchema,
  type CriarFichaEsteticaCorporalInput,
} from "@/modules/fichas/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

/**
 * Tipo de ENTRADA do formulário (pré-parse). Alguns campos usam `z.preprocess` (ex.: "" → undefined),
 * o que faz o tipo de entrada do Zod divergir do tipo de saída — por isso o `useForm` é tipado com
 * `z.input<>` aqui e recebe `CriarFichaEsteticaCorporalInput` (saída) só no `onSubmit`, via 3º genérico.
 */
type EntradaFormulario = z.input<typeof criarFichaEsteticaCorporalSchema>;

export type FichaEsteticaCorporalEdicao = {
  id: string;
  servicoId: string | null;
  autorizacaoImagemEm: Date | null;
  respostas: CriarFichaEsteticaCorporalInput["respostas"];
};

const valoresIniciais: EntradaFormulario = {
  clienteId: "",
  servicoId: undefined,
  autorizacaoImagem: false,
  respostas: {
    relato: {
      objetivoTratamento: "",
      queixaPrincipal: "",
      habitos: undefined,
      usaMedicamento: false,
      medicamentoDetalhe: undefined,
      realizouCirurgia: false,
      cirurgiaDetalhe: undefined,
      gestante: false,
      semanasGestacao: undefined,
      temAlergia: false,
      alergiaDetalhe: undefined,
      aceiteInformacoesVerdadeiras: false,
    },
    avaliacaoProfissional: {
      diagnosticoEstetico: undefined,
      procedimentosIndicados: undefined,
      observacoesInternas: undefined,
      contraindicacaoImportante: false,
      contraindicacaoDetalhe: undefined,
      medidas: {},
    },
    compartilhado: {
      resumoTratamento: undefined,
      orientacoes: undefined,
    },
  },
};

function Campo({
  children,
  error,
  label,
  htmlFor,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  htmlFor: string;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-perigo">{error}</p> : null}
    </div>
  );
}

const classeInput =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeArea =
  "min-h-24 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";
const classeCheckbox =
  "flex items-center gap-2 text-sm text-foreground [&>input]:size-4 [&>input]:rounded [&>input]:border-border [&>input]:text-brand [&>input]:focus:ring-roxo";

function clonarValoresIniciais(clienteId: string): EntradaFormulario {
  return {
    clienteId,
    servicoId: undefined,
    autorizacaoImagem: false,
    respostas: {
      relato: { ...valoresIniciais.respostas.relato },
      avaliacaoProfissional: {
        ...valoresIniciais.respostas.avaliacaoProfissional,
        medidas: { ...valoresIniciais.respostas.avaliacaoProfissional.medidas },
      },
      compartilhado: { ...valoresIniciais.respostas.compartilhado },
    },
  };
}

function montarValoresFormulario(
  clienteId: string,
  ficha?: FichaEsteticaCorporalEdicao,
): EntradaFormulario {
  const base = clonarValoresIniciais(clienteId);

  if (!ficha) return base;

  return {
    ...base,
    servicoId: ficha.servicoId ?? undefined,
    autorizacaoImagem: Boolean(ficha.autorizacaoImagemEm),
    respostas: {
      relato: {
        ...base.respostas.relato,
        ...ficha.respostas.relato,
      },
      avaliacaoProfissional: {
        ...base.respostas.avaliacaoProfissional,
        ...ficha.respostas.avaliacaoProfissional,
        medidas: {
          ...base.respostas.avaliacaoProfissional.medidas,
          ...ficha.respostas.avaliacaoProfissional.medidas,
        },
      },
      compartilhado: {
        ...base.respostas.compartilhado,
        ...ficha.respostas.compartilhado,
      },
    },
  };
}

export function FormularioFichaEsteticaCorporal({
  clienteId,
  clienteNome,
  ficha,
  servicos,
}: {
  clienteId: string;
  clienteNome: string;
  ficha?: FichaEsteticaCorporalEdicao;
  servicos: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const fecharModal = useFecharModal();
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntradaFormulario, unknown, CriarFichaEsteticaCorporalInput>({
    resolver: zodResolver(criarFichaEsteticaCorporalSchema),
    defaultValues: montarValoresFormulario(clienteId, ficha),
  });

  const relato = watch("respostas.relato");
  const avaliacao = watch("respostas.avaliacaoProfissional");

  async function onSubmit(dados: CriarFichaEsteticaCorporalInput) {
    setErroEnvio(null);
    const resultado = ficha
      ? await editarFichaEsteticaCorporal({ ...dados, id: ficha.id })
      : await criarFichaEsteticaCorporal(dados);

    if (resultado.status === "erro") {
      setErroEnvio(resultado.mensagem);
      return;
    }

    router.refresh();
    fecharModal();
  }

  const erros = errors.respostas;

  return (
    <form className="grid min-w-0 gap-8" onSubmit={handleSubmit(onSubmit)}>
      <p className="rounded-xl bg-lilas/15 px-3 py-2 text-sm text-roxo">Cliente: {clienteNome}</p>
      {ficha ? (
        <p className="rounded-xl bg-creme px-3 py-2 text-sm text-muted">
          Ao salvar, uma nova versão será registrada para preservar a ficha assinada.
        </p>
      ) : null}

      {servicos.length > 0 ? (
        <Campo htmlFor="servicoId" label="Serviço (opcional)">
          <select className={classeInput} id="servicoId" {...register("servicoId")}>
            <option value="">Sem serviço vinculado</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Relato do cliente</h3>

        <Campo
          error={erros?.relato?.objetivoTratamento?.message}
          htmlFor="objetivoTratamento"
          label="Objetivo do tratamento"
        >
          <textarea
            className={classeArea}
            id="objetivoTratamento"
            placeholder="Ex.: reduzir medidas abdominais e melhorar a textura da pele"
            {...register("respostas.relato.objetivoTratamento")}
          />
        </Campo>

        <Campo
          error={erros?.relato?.queixaPrincipal?.message}
          htmlFor="queixaPrincipal"
          label="Queixa principal"
        >
          <textarea
            className={classeArea}
            id="queixaPrincipal"
            placeholder="Ex.: gordura localizada, retenção de líquido ou celulite"
            {...register("respostas.relato.queixaPrincipal")}
          />
        </Campo>

        <Campo htmlFor="habitos" label="Hábitos (opcional)">
          <textarea
            className={classeArea}
            id="habitos"
            placeholder="Ex.: rotina alimentar, hidratação, sono e atividade física"
            {...register("respostas.relato.habitos")}
          />
        </Campo>

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.usaMedicamento")} />
          Usa medicamento
        </label>
        {relato?.usaMedicamento ? (
          <Campo
            error={erros?.relato?.medicamentoDetalhe?.message}
            htmlFor="medicamentoDetalhe"
            label="Qual medicamento, dose e frequência"
          >
            <input
              className={classeInput}
              id="medicamentoDetalhe"
              placeholder="Ex.: anticoncepcional oral, 1x ao dia"
              {...register("respostas.relato.medicamentoDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.realizouCirurgia")} />
          Realizou cirurgia
        </label>
        {relato?.realizouCirurgia ? (
          <Campo
            error={erros?.relato?.cirurgiaDetalhe?.message}
            htmlFor="cirurgiaDetalhe"
            label="Tipo, data e região da cirurgia"
          >
            <input
              className={classeInput}
              id="cirurgiaDetalhe"
              placeholder="Ex.: cesárea em 2020, região abdominal"
              {...register("respostas.relato.cirurgiaDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.gestante")} />
          Gestante
        </label>
        {relato?.gestante ? (
          <Campo
            error={erros?.relato?.semanasGestacao?.message}
            htmlFor="semanasGestacao"
            label="Quantas semanas"
          >
            <input
              className={classeInput}
              id="semanasGestacao"
              placeholder="Ex.: 12"
              type="number"
              {...register("respostas.relato.semanasGestacao")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.temAlergia")} />
          Tem alergia
        </label>
        {relato?.temAlergia ? (
          <Campo
            error={erros?.relato?.alergiaDetalhe?.message}
            htmlFor="alergiaDetalhe"
            label="Qual substância e qual reação"
          >
            <input
              className={classeInput}
              id="alergiaDetalhe"
              placeholder="Ex.: alergia a dipirona, causa urticária"
              {...register("respostas.relato.alergiaDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.aceiteInformacoesVerdadeiras")} />
          Cliente confirma que as informações acima são verdadeiras
        </label>
        {erros?.relato?.aceiteInformacoesVerdadeiras ? (
          <p className="text-sm text-perigo">{erros.relato.aceiteInformacoesVerdadeiras.message}</p>
        ) : null}
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Avaliação da profissional</h3>

        <Campo htmlFor="diagnosticoEstetico" label="Diagnóstico estético (opcional)">
          <textarea
            className={classeArea}
            id="diagnosticoEstetico"
            placeholder="Ex.: edema leve, flacidez e adiposidade localizada"
            {...register("respostas.avaliacaoProfissional.diagnosticoEstetico")}
          />
        </Campo>

        <Campo htmlFor="procedimentosIndicados" label="Procedimentos indicados (opcional)">
          <textarea
            className={classeArea}
            id="procedimentosIndicados"
            placeholder="Ex.: drenagem linfática, radiofrequência e orientações domiciliares"
            {...register("respostas.avaliacaoProfissional.procedimentosIndicados")}
          />
        </Campo>

        <label className={classeCheckbox}>
          <input
            type="checkbox"
            {...register("respostas.avaliacaoProfissional.contraindicacaoImportante")}
          />
          Contraindicação importante identificada
        </label>
        {avaliacao?.contraindicacaoImportante ? (
          <div className="rounded-lg border border-dourado/40 bg-dourado/10 p-3">
            <Campo
              error={erros?.avaliacaoProfissional?.contraindicacaoDetalhe?.message}
              htmlFor="contraindicacaoDetalhe"
              label="Descreva a contraindicação (alerta interno)"
            >
              <input
                className={classeInput}
                id="contraindicacaoDetalhe"
                placeholder="Ex.: evitar procedimento térmico em área sensibilizada"
                {...register("respostas.avaliacaoProfissional.contraindicacaoDetalhe")}
              />
            </Campo>
          </div>
        ) : null}

        <div className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Medidas iniciais (cm, opcional)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["abdomenAcima", "5cm acima do umbigo"],
                ["linhaUmbigo", "Linha do umbigo"],
                ["abdomenAbaixo", "5cm abaixo"],
                ["quadril", "Quadril"],
                ["gluteo", "Glúteo"],
                ["coxaDireita", "Coxa direita"],
                ["coxaEsquerda", "Coxa esquerda"],
                ["bracoDireito", "Braço direito"],
                ["bracoEsquerdo", "Braço esquerdo"],
              ] as const
            ).map(([campo, label]) => (
              <Campo key={campo} htmlFor={campo} label={label}>
                <input
                  className={classeInput}
                  id={campo}
                  placeholder="Ex.: 82,5"
                  step="0.1"
                  type="number"
                  {...register(`respostas.avaliacaoProfissional.medidas.${campo}`)}
                />
              </Campo>
            ))}
          </div>
        </div>

        <Campo
          htmlFor="observacoesInternas"
          label="Observações internas (opcional, não visível ao cliente)"
        >
          <textarea
            className={classeArea}
            id="observacoesInternas"
            placeholder="Anotações internas para a equipe, não visíveis ao cliente"
            {...register("respostas.avaliacaoProfissional.observacoesInternas")}
          />
        </Campo>
      </section>

      <section className="grid gap-4">
        <h3 className="font-semibold text-roxo">Área compartilhada</h3>

        <Campo htmlFor="resumoTratamento" label="Resumo do tratamento (opcional)">
          <textarea
            className={classeArea}
            id="resumoTratamento"
            placeholder="Resumo claro do plano para exibição no portal do cliente"
            {...register("respostas.compartilhado.resumoTratamento")}
          />
        </Campo>

        <Campo htmlFor="orientacoes" label="Orientações (opcional)">
          <textarea
            className={classeArea}
            id="orientacoes"
            placeholder="Ex.: beber água, evitar exposição solar e seguir cuidados combinados"
            {...register("respostas.compartilhado.orientacoes")}
          />
        </Campo>
      </section>

      <div className="grid gap-3 rounded-lg bg-creme p-4">
        <label className={classeCheckbox}>
          <input type="checkbox" {...register("autorizacaoImagem")} />
          Cliente autorizou uso de imagem (consentimento separado do atendimento)
        </label>
      </div>

      {erroEnvio ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {erroEnvio}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" />
          )}
          {ficha ? "Salvar nova versão" : "Salvar ficha"}
        </button>
      </div>
    </form>
  );
}
