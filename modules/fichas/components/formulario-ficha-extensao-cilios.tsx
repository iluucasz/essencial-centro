"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import type { z } from "zod";

import { criarFichaExtensaoCilios, editarFichaExtensaoCilios } from "@/modules/fichas/actions";
import {
  criarFichaExtensaoCiliosSchema,
  type CriarFichaExtensaoCiliosInput,
} from "@/modules/fichas/schema";
import { useFecharModal } from "@/components/ui/modal-formulario";

/** Ver formulario-ficha-estetica-corporal.tsx para a explicação do `z.input<>` aqui — mesmo
 * motivo: campos com `z.preprocess` fazem o tipo de entrada divergir do tipo de saída do Zod. */
type EntradaFormulario = z.input<typeof criarFichaExtensaoCiliosSchema>;

export type FichaExtensaoCiliosEdicao = {
  id: string;
  servicoId: string | null;
  autorizacaoImagemEm: Date | null;
  respostas: CriarFichaExtensaoCiliosInput["respostas"];
};

const valoresIniciais: EntradaFormulario = {
  clienteId: "",
  servicoId: undefined,
  autorizacaoImagem: false,
  respostas: {
    relato: {
      objetivoProcedimento: "",
      jaFezExtensaoCilios: false,
      teveReacaoAdesivo: false,
      reacaoAdesivoDetalhe: undefined,
      usaLentesContato: false,
      temProblemaOcular: false,
      problemaOcularDetalhe: undefined,
      temAlergia: false,
      alergiaDetalhe: undefined,
      gestanteOuLactante: false,
      realizouCirurgiaOcularRecente: false,
      cirurgiaOcularDetalhe: undefined,
      aceiteInformacoesVerdadeiras: false,
    },
    avaliacaoProfissional: {
      tecnicaAplicada: undefined,
      curvaturaEspessuraFios: undefined,
      observacoesInternas: undefined,
      contraindicacaoImportante: false,
      contraindicacaoDetalhe: undefined,
    },
    compartilhado: {
      resumoProcedimento: undefined,
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
      avaliacaoProfissional: { ...valoresIniciais.respostas.avaliacaoProfissional },
      compartilhado: { ...valoresIniciais.respostas.compartilhado },
    },
  };
}

function montarValoresFormulario(
  clienteId: string,
  ficha?: FichaExtensaoCiliosEdicao,
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
      },
      compartilhado: {
        ...base.respostas.compartilhado,
        ...ficha.respostas.compartilhado,
      },
    },
  };
}

export function FormularioFichaExtensaoCilios({
  clienteId,
  clienteNome,
  ficha,
  servicos,
}: {
  clienteId: string;
  clienteNome: string;
  ficha?: FichaExtensaoCiliosEdicao;
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
  } = useForm<EntradaFormulario, unknown, CriarFichaExtensaoCiliosInput>({
    resolver: zodResolver(criarFichaExtensaoCiliosSchema),
    defaultValues: montarValoresFormulario(clienteId, ficha),
  });

  const relato = watch("respostas.relato");
  const avaliacao = watch("respostas.avaliacaoProfissional");

  async function onSubmit(dados: CriarFichaExtensaoCiliosInput) {
    setErroEnvio(null);
    const resultado = ficha
      ? await editarFichaExtensaoCilios({ ...dados, id: ficha.id })
      : await criarFichaExtensaoCilios(dados);

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
          error={erros?.relato?.objetivoProcedimento?.message}
          htmlFor="objetivoProcedimento"
          label="Objetivo do procedimento"
        >
          <textarea
            className={classeArea}
            id="objetivoProcedimento"
            placeholder="Ex.: alongamento natural com volume leve para rotina diária"
            {...register("respostas.relato.objetivoProcedimento")}
          />
        </Campo>

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.jaFezExtensaoCilios")} />
          Já fez extensão de cílios antes
        </label>

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.teveReacaoAdesivo")} />
          Já teve reação ao adesivo/cola em algum procedimento
        </label>
        {relato?.teveReacaoAdesivo ? (
          <Campo
            error={erros?.relato?.reacaoAdesivoDetalhe?.message}
            htmlFor="reacaoAdesivoDetalhe"
            label="Descreva a reação apresentada"
          >
            <input
              className={classeInput}
              id="reacaoAdesivoDetalhe"
              placeholder="Ex.: ardência, vermelhidão ou inchaço após aplicação"
              {...register("respostas.relato.reacaoAdesivoDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.usaLentesContato")} />
          Usa lentes de contato
        </label>

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.temProblemaOcular")} />
          Tem alguma condição ocular (conjuntivite, blefarite, olho seco, etc.)
        </label>
        {relato?.temProblemaOcular ? (
          <Campo
            error={erros?.relato?.problemaOcularDetalhe?.message}
            htmlFor="problemaOcularDetalhe"
            label="Descreva a condição ocular"
          >
            <input
              className={classeInput}
              id="problemaOcularDetalhe"
              placeholder="Ex.: olho seco, blefarite ou conjuntivite recente"
              {...register("respostas.relato.problemaOcularDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.temAlergia")} />
          Tem alergia (cosméticos, látex, outros)
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
              placeholder="Ex.: alergia a látex ou cosméticos"
              {...register("respostas.relato.alergiaDetalhe")}
            />
          </Campo>
        ) : null}

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.gestanteOuLactante")} />
          Gestante ou lactante
        </label>

        <label className={classeCheckbox}>
          <input type="checkbox" {...register("respostas.relato.realizouCirurgiaOcularRecente")} />
          Realizou cirurgia ocular recente (ex.: correção a laser)
        </label>
        {relato?.realizouCirurgiaOcularRecente ? (
          <Campo
            error={erros?.relato?.cirurgiaOcularDetalhe?.message}
            htmlFor="cirurgiaOcularDetalhe"
            label="Tipo e data da cirurgia"
          >
            <input
              className={classeInput}
              id="cirurgiaOcularDetalhe"
              placeholder="Ex.: cirurgia a laser em março de 2025"
              {...register("respostas.relato.cirurgiaOcularDetalhe")}
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

        <Campo htmlFor="tecnicaAplicada" label="Técnica aplicada (opcional)">
          <input
            className={classeInput}
            id="tecnicaAplicada"
            placeholder="Ex.: fio a fio, volume russo ou híbrido"
            {...register("respostas.avaliacaoProfissional.tecnicaAplicada")}
          />
        </Campo>

        <Campo htmlFor="curvaturaEspessuraFios" label="Curvatura e espessura dos fios (opcional)">
          <input
            className={classeInput}
            id="curvaturaEspessuraFios"
            placeholder="Ex.: curvatura C, espessura 0.07"
            {...register("respostas.avaliacaoProfissional.curvaturaEspessuraFios")}
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
                placeholder="Ex.: irritação ocular ativa, adiar procedimento"
                {...register("respostas.avaliacaoProfissional.contraindicacaoDetalhe")}
              />
            </Campo>
          </div>
        ) : null}

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

        <Campo htmlFor="resumoProcedimento" label="Resumo do procedimento (opcional)">
          <textarea
            className={classeArea}
            id="resumoProcedimento"
            placeholder="Resumo claro do procedimento para exibição no portal do cliente"
            {...register("respostas.compartilhado.resumoProcedimento")}
          />
        </Campo>

        <Campo htmlFor="orientacoes" label="Orientações de cuidados pós-procedimento (opcional)">
          <textarea
            className={classeArea}
            id="orientacoes"
            placeholder="Ex.: não molhar nas primeiras horas e evitar produtos oleosos"
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
