"use client";

import { useEffect } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { NotebookPen } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";

import type { SessaoParaCliente } from "../acesso";

const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

function CampoDetalhe({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor?.trim()) return null;

  return (
    <div className="grid gap-1 rounded-2xl border border-border bg-creme p-4">
      <dt className="text-xs font-semibold text-roxo">{label}</dt>
      <dd className="text-sm leading-6 text-foreground">{valor}</dd>
    </div>
  );
}

function DetalhesSessaoPortal({ sessao }: { sessao: SessaoParaCliente }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 rounded-2xl bg-creme p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-muted">Data</dt>
          <dd className="mt-1 text-sm text-foreground">{formatadorData.format(sessao.dataHora)}</dd>
        </div>
        {sessao.duracaoMinutos ? (
          <div>
            <dt className="text-xs font-semibold text-muted">Duração</dt>
            <dd className="mt-1 text-sm text-foreground">{sessao.duracaoMinutos} min</dd>
          </div>
        ) : null}
        {sessao.escalaDorAntes !== null && sessao.escalaDorDepois !== null ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted">Dor antes/depois</dt>
            <dd className="mt-1 text-sm text-foreground">
              {sessao.escalaDorAntes}/10 → {sessao.escalaDorDepois}/10
            </dd>
          </div>
        ) : null}
      </div>

      <CampoDetalhe label="Condição relatada antes da sessão" valor={sessao.condicaoAntes} />
      <CampoDetalhe label="Seu relato" valor={sessao.relatoCliente} />
      <CampoDetalhe label="Orientações pós-atendimento" valor={sessao.orientacoesPosAtendimento} />
      {sessao.proximaSessaoRecomendada ? (
        <CampoDetalhe
          label="Próxima sessão recomendada"
          valor={formatadorData.format(sessao.proximaSessaoRecomendada)}
        />
      ) : null}
    </div>
  );
}

function CartaoSessaoPortal({
  abrirInicialmente,
  sessao,
}: {
  abrirInicialmente: boolean;
  sessao: SessaoParaCliente;
}) {
  const modal = useOverlayState();

  useEffect(() => {
    if (abrirInicialmente) modal.open();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem: abrir de novo a cada re-render do estado do modal seria um loop.
  }, [abrirInicialmente]);

  return (
    <li>
      <button
        className="grid w-full gap-2 rounded-lg border border-border bg-surface p-4 text-left transition hover:border-roxo/30 hover:bg-lilas/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={modal.open}
        type="button"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-foreground">{sessao.regiaoTratada ?? "Sessão"}</span>
          <span className="text-xs text-muted">{formatadorData.format(sessao.dataHora)}</span>
        </div>

        {sessao.escalaDorAntes !== null && sessao.escalaDorDepois !== null ? (
          <p className="text-sm text-foreground">
            Dor antes/depois: {sessao.escalaDorAntes} → {sessao.escalaDorDepois}
          </p>
        ) : null}

        {sessao.orientacoesPosAtendimento ? (
          <p className="line-clamp-2 text-sm text-foreground">
            <span className="font-medium">Orientações: </span>
            {sessao.orientacoesPosAtendimento}
          </p>
        ) : null}

        <span className="text-xs font-medium text-roxo">Ver sessão completa</span>
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={sessao.regiaoTratada ?? "Sessão"}>
              <DetalhesSessaoPortal sessao={sessao} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function ListaSessoesPortal({
  sessaoDestaqueId,
  sessoes,
}: {
  sessaoDestaqueId?: string;
  sessoes: SessaoParaCliente[];
}) {
  if (sessoes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        <NotebookPen className="size-4 shrink-0" aria-hidden="true" />
        Nenhuma sessão registrada ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {sessoes.map((sessao) => (
        <CartaoSessaoPortal
          abrirInicialmente={sessao.id === sessaoDestaqueId}
          key={sessao.id}
          sessao={sessao}
        />
      ))}
    </ul>
  );
}
