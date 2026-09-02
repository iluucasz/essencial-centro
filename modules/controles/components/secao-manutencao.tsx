"use client";

import { useActionState, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { Bug, Droplets, Gauge, LoaderCircle, Paperclip, Plus, Recycle, Trash2 } from "lucide-react";
import type { ComponentType } from "react";

import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { excluirControle, type EstadoExclusaoControle } from "@/modules/controles/actions";
import { rotulosTipoControle, tiposControle, type TipoControle } from "@/modules/controles/schema";

import { FormularioRegistroControle } from "./formulario-registro-controle";

const iconesPorTipo: Record<TipoControle, ComponentType<{ className?: string }>> = {
  calibracao_equipamentos: Gauge,
  limpeza_caixa_dagua: Droplets,
  dedetizacao: Bug,
  coleta_materiais: Recycle,
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

type RegistroExibicao = {
  id: string;
  tipo: TipoControle;
  dataRealizacao: Date;
  arquivoNome: string | null;
};

function CartaoTipoControle({ tipo, ultimaData }: { tipo: TipoControle; ultimaData: Date | null }) {
  const modal = useOverlayState();
  const Icone = iconesPorTipo[tipo];

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
      <span className="flex size-9 items-center justify-center rounded-xl bg-lilas/35 text-roxo">
        <Icone className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{rotulosTipoControle[tipo]}</p>
        <p className="mt-0.5 text-xs text-muted">
          {ultimaData ? `Última vez: ${formatadorData.format(ultimaData)}` : "Nunca registrado"}
        </p>
      </div>

      <button
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={modal.open}
        type="button"
      >
        <Plus className="size-3.5 text-roxo" aria-hidden="true" />
        Registrar
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo={rotulosTipoControle[tipo]}>
              <FecharModalProvider value={modal.close}>
                <FormularioRegistroControle tipo={tipo} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

const estadoInicialExclusao: EstadoExclusaoControle = { status: "inicial" };

function LinhaHistorico({ registro }: { registro: RegistroExibicao }) {
  const [estado, formAction, pendente] = useActionState(excluirControle, estadoInicialExclusao);
  const Icone = iconesPorTipo[registro.tipo];

  if (estado.status === "sucesso") return null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lilas/25 text-roxo">
          <Icone className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {rotulosTipoControle[registro.tipo]}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            {formatadorData.format(registro.dataRealizacao)}
            {registro.arquivoNome ? (
              <a
                className="flex items-center gap-1 text-roxo hover:underline"
                href={`/api/controles/${registro.id}/arquivo`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Paperclip className="size-3" aria-hidden="true" />
                Anexo
              </a>
            ) : null}
          </span>
        </span>
      </span>

      <form action={formAction}>
        <input name="id" type="hidden" value={registro.id} />
        <button
          aria-label={`Excluir registro de ${rotulosTipoControle[registro.tipo]}`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-perigo/10 hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pendente}
          type="submit"
        >
          {pendente ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </button>
      </form>
    </li>
  );
}

export function SecaoManutencao({
  registros,
  ultimaDataPorTipo,
}: {
  registros: RegistroExibicao[];
  ultimaDataPorTipo: Record<TipoControle, Date | null>;
}) {
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiposControle.map((tipo) => (
          <CartaoTipoControle key={tipo} tipo={tipo} ultimaData={ultimaDataPorTipo[tipo]} />
        ))}
      </div>

      {registros.length > 0 ? (
        <div className="grid gap-3">
          <button
            className="justify-self-start text-sm font-medium text-roxo hover:underline"
            onClick={() => setMostrarHistorico((atual) => !atual)}
            type="button"
          >
            {mostrarHistorico ? "Ocultar histórico" : `Ver histórico (${registros.length})`}
          </button>

          {mostrarHistorico ? (
            <ul className="grid gap-2">
              {registros.map((registro) => (
                <LinhaHistorico key={registro.id} registro={registro} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
