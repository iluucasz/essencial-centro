"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  CheckCircle2,
  Ellipsis,
  Eye,
  LoaderCircle,
  Pencil,
  Pill,
  Trash2,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import {
  confirmarVerificacaoMedicamento,
  excluirMedicamentoInformado,
  type EstadoExclusaoMedicamento,
} from "@/modules/medicamentos/actions";
import { precisaVerificacao } from "@/modules/medicamentos/verificacao";

import { FormularioMedicamento, type MedicamentoFormulario } from "./formulario-medicamento";

export type MedicamentoLista = MedicamentoFormulario & {
  verificadoEm: Date | null;
  verificadoPorNome: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

const estadoInicialExclusao: EstadoExclusaoMedicamento = { status: "inicial" };

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

function detalhesMedicamento(medicamento: MedicamentoLista) {
  return (
    [
      medicamento.dosagem,
      medicamento.frequencia,
      medicamento.profissionalPrescritor
        ? `prescrito por ${medicamento.profissionalPrescritor}`
        : null,
      medicamento.dataInicio ? `início ${formatadorData.format(medicamento.dataInicio)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Sem detalhes adicionais"
  );
}

function CampoDetalhe({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{valor?.trim() || "Não informado"}</dd>
    </div>
  );
}

function DetalhesMedicamento({ medicamento }: { medicamento: MedicamentoLista }) {
  return (
    <div className="grid gap-5">
      <dl className="grid gap-3 rounded-2xl bg-creme p-4 sm:grid-cols-2">
        <CampoDetalhe label="Medicamento" valor={medicamento.nome} />
        <CampoDetalhe label="Dosagem" valor={medicamento.dosagem} />
        <CampoDetalhe label="Frequência" valor={medicamento.frequencia} />
        <CampoDetalhe label="Profissional prescritor" valor={medicamento.profissionalPrescritor} />
        <CampoDetalhe
          label="Data de início"
          valor={medicamento.dataInicio ? formatadorData.format(medicamento.dataInicio) : null}
        />
        <CampoDetalhe
          label="Verificação"
          valor={
            medicamento.verificadoEm
              ? `Verificado em ${formatadorDataHora.format(medicamento.verificadoEm)}${
                  medicamento.verificadoPorNome ? ` por ${medicamento.verificadoPorNome}` : ""
                }`
              : "Pendente"
          }
        />
        <CampoDetalhe
          label="Registrado em"
          valor={formatadorDataHora.format(medicamento.criadoEm)}
        />
        <CampoDetalhe
          label="Atualizado em"
          valor={formatadorDataHora.format(medicamento.atualizadoEm)}
        />
      </dl>

      {medicamento.alergiaRelacionada ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-roxo">Alergia relacionada</h3>
          <p className="mt-2 text-sm leading-6 text-foreground">{medicamento.alergiaRelacionada}</p>
        </section>
      ) : null}

      {medicamento.alertaInteracao ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-perigo">Alerta de interação</h3>
          <p className="mt-2 text-sm leading-6 text-foreground">{medicamento.alertaInteracao}</p>
          {medicamento.fonteAlerta ? (
            <p className="mt-2 text-xs font-medium text-muted">Fonte: {medicamento.fonteAlerta}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function StatusVerificacao({
  clienteId,
  medicamento,
}: {
  clienteId: string;
  medicamento: MedicamentoLista;
}) {
  if (medicamento.verificadoEm) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Verificado
      </span>
    );
  }

  if (!precisaVerificacao(medicamento.verificadoEm)) return null;

  return (
    <form action={confirmarVerificacaoMedicamento}>
      <input name="id" type="hidden" value={medicamento.id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <button
        className="inline-flex items-center gap-1 rounded-full bg-dourado/20 px-3 py-1 text-xs font-semibold text-dourado transition hover:bg-dourado/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
        type="submit"
      >
        <TriangleAlert className="size-3.5" aria-hidden="true" />
        Confirmar verificação
      </button>
    </form>
  );
}

function ItemMedicamento({
  clienteId,
  medicamento,
}: {
  clienteId: string;
  medicamento: MedicamentoLista;
}) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(
    excluirMedicamentoInformado,
    estadoInicialExclusao,
  );
  const { gatilhoRef, abrirParaCima } = usePosicaoMenuAcoes(menuAberto);

  useEffect(() => {
    if (state.status !== "sucesso") return;

    modalExclusao.close();
    router.refresh();
  }, [modalExclusao, router, state.status]);

  function fecharMenuAoPerderFoco(event: FocusEvent<HTMLDivElement>) {
    const proximoFoco = event.relatedTarget;

    if (proximoFoco instanceof Node && event.currentTarget.contains(proximoFoco)) return;

    setMenuAberto(false);
  }

  return (
    <li className="px-3 py-3 sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <button
          className="flex min-w-0 items-start gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={modalVisualizacao.open}
          type="button"
        >
          <span className="bg-menta mt-1 flex size-12 shrink-0 items-center justify-center rounded-2xl text-brand">
            <Pill className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-foreground">
              {medicamento.nome}
            </span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted">
              {detalhesMedicamento(medicamento)}
            </span>
            {medicamento.alergiaRelacionada || medicamento.alertaInteracao ? (
              <span className="mt-3 flex flex-wrap gap-2 text-xs">
                {medicamento.alergiaRelacionada ? (
                  <span className="rounded-full bg-lilas/25 px-2 py-0.5 font-semibold text-roxo">
                    Alergia
                  </span>
                ) : null}
                {medicamento.alertaInteracao ? (
                  <span className="rounded-full bg-perigo/10 px-2 py-0.5 font-semibold text-perigo">
                    Alerta
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        </button>

        <span className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <StatusVerificacao clienteId={clienteId} medicamento={medicamento} />

          <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
            <button
              aria-expanded={menuAberto}
              aria-haspopup="menu"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              title={`Ações do medicamento ${medicamento.nome}`}
              type="button"
            >
              <Ellipsis className="size-5" aria-hidden="true" />
              <span className="sr-only">Abrir ações do medicamento {medicamento.nome}</span>
            </button>

            {menuAberto ? (
              <div
                className={`absolute right-0 z-20 w-60 rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
                role="menu"
              >
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  onClick={() => {
                    setMenuAberto(false);
                    modalVisualizacao.open();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Eye className="size-4 text-roxo" aria-hidden="true" />
                  Ver medicamento
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  onClick={() => {
                    setMenuAberto(false);
                    modalEdicao.open();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Pencil className="size-4 text-roxo" aria-hidden="true" />
                  Editar medicamento
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-perigo transition hover:bg-perigo/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
                  onClick={() => {
                    setMenuAberto(false);
                    setConfirmado(false);
                    modalExclusao.open();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Excluir medicamento
                </button>
              </div>
            ) : null}
          </div>
        </span>
      </div>

      <Modal state={modalVisualizacao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={medicamento.nome}>
              <DetalhesMedicamento medicamento={medicamento} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar ${medicamento.nome}`}>
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioMedicamento clienteId={clienteId} medicamento={medicamento} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir medicamento">
              <form action={formAction} className="grid gap-4">
                <input name="id" type="hidden" value={medicamento.id} />
                <input name="clienteId" type="hidden" value={clienteId} />
                <p className="text-sm text-foreground">
                  Você está prestes a excluir o medicamento {medicamento.nome}. Esta ação remove o
                  registro do prontuário.
                </p>
                <label className="flex items-start gap-3 rounded-xl bg-creme p-3 text-sm text-foreground">
                  <input
                    checked={confirmado}
                    className="mt-1 size-4 rounded border-border text-perigo focus:ring-perigo"
                    name="confirmarExclusao"
                    onChange={(event) => setConfirmado(event.target.checked)}
                    type="checkbox"
                    value="true"
                  />
                  <span>Entendo que a exclusão não pode ser desfeita.</span>
                </label>

                {state.status === "erro" && state.mensagem ? (
                  <p className="text-sm font-medium text-perigo" role="alert">
                    {state.mensagem}
                  </p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => {
                      setConfirmado(false);
                      modalExclusao.close();
                    }}
                    type="button"
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!confirmado || pending}
                    type="submit"
                  >
                    {pending ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Excluir definitivamente
                  </button>
                </div>
              </form>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function ListaMedicamentos({
  clienteId,
  medicamentos,
}: {
  clienteId: string;
  medicamentos: MedicamentoLista[];
}) {
  if (medicamentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-sm text-muted">
        <span className="bg-menta rounded-2xl p-3 text-brand">
          <Pill className="size-4" aria-hidden="true" />
        </span>
        Nenhum medicamento informado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">Medicamentos informados</h3>
      </div>
      <ul className="divide-y divide-border">
        {medicamentos.map((medicamento) => (
          <ItemMedicamento clienteId={clienteId} key={medicamento.id} medicamento={medicamento} />
        ))}
      </ul>
    </div>
  );
}
