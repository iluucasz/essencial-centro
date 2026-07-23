"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { ChevronDown, ChevronUp, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { criarModeloFicha, editarModeloFicha } from "@/modules/fichas/modelos-actions";
import {
  audienciasCampo,
  campoUsaOpcoes,
  rotulosAudienciaCampo,
  rotulosTipoCampo,
  tiposCampo,
  type CampoModelo,
} from "@/modules/fichas/campos";

type ValoresConstrutor = {
  nome: string;
  descricao: string;
  ativo: boolean;
  campos: CampoModelo[];
};

const classeInput =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function novoId() {
  return `c${Math.random().toString(36).slice(2, 10)}`;
}

function campoPadrao(): CampoModelo {
  return {
    id: novoId(),
    tipo: "texto_curto",
    rotulo: "",
    obrigatorio: false,
    quemPreenche: "cliente",
  };
}

export function ConstrutorModelo({
  modelo,
  aposSucesso,
}: {
  modelo?: {
    id: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    campos: CampoModelo[];
  };
  aposSucesso?: () => void;
}) {
  const router = useRouter();
  const { control, register, handleSubmit, watch, setValue } = useForm<ValoresConstrutor>({
    defaultValues: {
      nome: modelo?.nome ?? "",
      descricao: modelo?.descricao ?? "",
      ativo: modelo?.ativo ?? true,
      campos: modelo?.campos.length ? modelo.campos : [campoPadrao()],
    },
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: "campos" });
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const campos = watch("campos");

  async function salvar(valores: ValoresConstrutor) {
    setErroGeral(null);
    setSalvando(true);

    try {
      const payload = {
        nome: valores.nome,
        descricao: valores.descricao,
        ativo: valores.ativo,
        campos: valores.campos,
      };
      const resultado = modelo
        ? await editarModeloFicha({ ...payload, id: modelo.id })
        : await criarModeloFicha(payload);

      if (resultado.status === "erro") {
        setErroGeral(resultado.mensagem);
        setConfirmando(false);
        return;
      }

      aposSucesso?.();
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(() => setConfirmando(true))}>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Nome do modelo *</span>
          <input
            className={classeInput}
            placeholder="Ex.: Anamnese de massoterapia"
            {...register("nome", { required: true })}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Descrição (opcional)</span>
          <input className={classeInput} {...register("descricao")} />
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            className="size-4 rounded border-border text-brand focus:ring-roxo"
            type="checkbox"
            {...register("ativo")}
          />
          Modelo ativo (disponível em &quot;Nova ficha&quot;)
        </label>
      </div>

      <div className="grid gap-3">
        {fields.map((field, indice) => {
          const tipoAtual = campos?.[indice]?.tipo;

          return (
            <fieldset
              className="grid gap-3 rounded-2xl border border-border bg-creme/40 p-4"
              key={field.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted">Campo {indice + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Mover para cima"
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-roxo disabled:opacity-40"
                    disabled={indice === 0}
                    onClick={() => move(indice, indice - 1)}
                    type="button"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    aria-label="Mover para baixo"
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-roxo disabled:opacity-40"
                    disabled={indice === fields.length - 1}
                    onClick={() => move(indice, indice + 1)}
                    type="button"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                  <button
                    aria-label="Remover campo"
                    className="rounded-lg p-1.5 text-perigo transition hover:bg-perigo/10 disabled:opacity-40"
                    disabled={fields.length === 1}
                    onClick={() => remove(indice)}
                    type="button"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-foreground">Título / pergunta *</span>
                <input className={classeInput} {...register(`campos.${indice}.rotulo`)} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-foreground">Tipo</span>
                  <select className={classeInput} {...register(`campos.${indice}.tipo`)}>
                    {tiposCampo.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {rotulosTipoCampo[tipo]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-foreground">Quem preenche</span>
                  <select className={classeInput} {...register(`campos.${indice}.quemPreenche`)}>
                    {audienciasCampo.map((audiencia) => (
                      <option key={audiencia} value={audiencia}>
                        {rotulosAudienciaCampo[audiencia]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  Texto de ajuda (opcional)
                </span>
                <input className={classeInput} {...register(`campos.${indice}.ajuda`)} />
              </label>

              {tipoAtual && campoUsaOpcoes(tipoAtual) ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Opções (uma por linha)
                  </span>
                  <textarea
                    className={`${classeInput} min-h-24`}
                    defaultValue={(campos?.[indice]?.opcoes ?? []).join("\n")}
                    onChange={(evento) =>
                      setValue(
                        `campos.${indice}.opcoes`,
                        evento.target.value
                          .split("\n")
                          .map((linha) => linha.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
              ) : null}

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    className="size-4 rounded border-border text-brand focus:ring-roxo"
                    type="checkbox"
                    {...register(`campos.${indice}.obrigatorio`)}
                  />
                  Obrigatório
                </label>
                {tipoAtual === "sim_nao" ? (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      className="size-4 rounded border-border text-brand focus:ring-roxo"
                      type="checkbox"
                      {...register(`campos.${indice}.detalheSeSim`)}
                    />
                    Pedir detalhe quando &quot;Sim&quot;
                  </label>
                ) : null}
              </div>
            </fieldset>
          );
        })}

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-roxo/40 px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/10"
          onClick={() => append(campoPadrao())}
          type="button"
        >
          <Plus className="size-4" aria-hidden />
          Adicionar campo
        </button>
      </div>

      {erroGeral ? (
        <p
          className="rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {erroGeral}
        </p>
      ) : null}

      {confirmando ? (
        <div className="grid gap-3 rounded-xl border border-roxo/20 bg-lilas/10 p-3">
          <p className="text-sm text-foreground">
            {modelo ? "Salvar as alterações deste modelo?" : "Criar este modelo de ficha?"}
          </p>
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
              disabled={salvando}
              onClick={handleSubmit(salvar)}
              type="button"
            >
              {salvando ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              {modelo ? "Salvar alterações" : "Criar modelo"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            type="submit"
          >
            {modelo ? "Revisar e salvar" : "Revisar e criar"}
          </button>
        </div>
      )}
    </form>
  );
}
