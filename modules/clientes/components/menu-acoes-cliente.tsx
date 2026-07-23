"use client";

import { useActionState, useEffect, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Ellipsis,
  Eye,
  HeartPulse,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Pill,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { usePosicaoMenuAcoes } from "@/components/ui/menu-acoes";
import {
  ConteudoModal,
  FecharModalProvider,
  ParteModalAnimada,
} from "@/components/ui/modal-formulario";
import { excluirCliente, type EstadoExclusaoCliente } from "@/modules/clientes/actions";

import { FormularioCliente, type ClienteFormulario } from "./formulario-cliente";

const estadoInicialExclusao: EstadoExclusaoCliente = { status: "inicial" };

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function valorTexto(valor: string | null | undefined) {
  return valor?.trim() || "Não informado";
}

function valorBooleano(valor: boolean) {
  return valor ? "Sim" : "Não";
}

function CampoVisualizacao({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  valor: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-border bg-surface p-4">
      <span className="flex items-center gap-2 text-xs font-semibold text-muted">
        <span className="text-roxo">{icone}</span>
        {label}
      </span>
      <span className="text-sm leading-6 font-medium text-foreground">{valor}</span>
    </div>
  );
}

function BlocoVisualizacao({
  icone,
  label,
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  valor: string | null | undefined;
}) {
  return (
    <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="rounded-xl bg-lilas/20 p-2 text-roxo">{icone}</span>
        {label}
      </h3>
      <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">{valorTexto(valor)}</p>
    </section>
  );
}

function VisualizacaoCliente({
  cliente,
  medicamentosEmUso,
}: {
  cliente: ClienteFormulario;
  medicamentosEmUso?: string | null;
}) {
  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-roxo/10 bg-lilas/15 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-roxo">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-foreground">
              {cliente.nome}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {valorTexto(cliente.profissao)} · {formatadorData.format(cliente.dataNascimento)}
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CampoVisualizacao
          icone={<CalendarDays className="size-4" aria-hidden="true" />}
          label="Data de nascimento"
          valor={formatadorData.format(cliente.dataNascimento)}
        />
        <CampoVisualizacao
          icone={<UserRound className="size-4" aria-hidden="true" />}
          label="Profissão"
          valor={valorTexto(cliente.profissao)}
        />
        <CampoVisualizacao
          icone={<Phone className="size-4" aria-hidden="true" />}
          label="Telefone"
          valor={valorTexto(cliente.telefone)}
        />
        <CampoVisualizacao
          icone={<Mail className="size-4" aria-hidden="true" />}
          label="E-mail"
          valor={valorTexto(cliente.email)}
        />
        <CampoVisualizacao
          icone={<Phone className="size-4" aria-hidden="true" />}
          label="Contato de emergência"
          valor={
            <span>
              {valorTexto(cliente.contatoEmergenciaNome)}
              <span className="block text-muted">
                {valorTexto(cliente.contatoEmergenciaTelefone)}
              </span>
            </span>
          }
        />
        <CampoVisualizacao
          icone={<MapPin className="size-4" aria-hidden="true" />}
          label="Endereço"
          valor={valorTexto(cliente.endereco)}
        />
      </div>

      <div className="grid gap-3">
        <BlocoVisualizacao
          icone={<HeartPulse className="size-4" aria-hidden="true" />}
          label="Objetivo do tratamento"
          valor={cliente.objetivoTratamento}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <BlocoVisualizacao
            icone={<ShieldCheck className="size-4" aria-hidden="true" />}
            label="Alergias"
            valor={cliente.alergias || "Sem alergias conhecidas"}
          />
          <BlocoVisualizacao
            icone={<Pill className="size-4" aria-hidden="true" />}
            label="Medicamentos em uso"
            valor={medicamentosEmUso ?? cliente.medicamentos}
          />
          <BlocoVisualizacao
            icone={<Activity className="size-4" aria-hidden="true" />}
            label="Condições de saúde"
            valor={cliente.condicoesSaude}
          />
          <BlocoVisualizacao
            icone={<ClipboardList className="size-4" aria-hidden="true" />}
            label="Cirurgias"
            valor={cliente.cirurgias}
          />
        </div>
        <BlocoVisualizacao
          icone={<ShieldCheck className="size-4" aria-hidden="true" />}
          label="Contraindicações"
          valor={cliente.contraindicacoes}
        />
        <BlocoVisualizacao
          icone={<ClipboardList className="size-4" aria-hidden="true" />}
          label="Observações internas"
          valor={cliente.observacoesInternas}
        />
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-creme/70 p-4 sm:grid-cols-2">
        <CampoVisualizacao
          icone={<CheckCircle2 className="size-4" aria-hidden="true" />}
          label="Consentimento de dados"
          valor={valorBooleano(cliente.consentimentoDados)}
        />
        <CampoVisualizacao
          icone={<CheckCircle2 className="size-4" aria-hidden="true" />}
          label="Consentimento de imagem"
          valor={valorBooleano(cliente.consentimentoImagem)}
        />
      </div>
    </div>
  );
}

export function MenuAcoesCliente({
  cliente,
  medicamentosEmUso,
  podeExcluir,
}: {
  cliente: ClienteFormulario;
  medicamentosEmUso?: string | null;
  podeExcluir: boolean;
}) {
  const router = useRouter();
  const modalVisualizacao = useOverlayState();
  const modalEdicao = useOverlayState();
  const modalExclusao = useOverlayState();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [state, formAction, pending] = useActionState(excluirCliente, estadoInicialExclusao);
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
    <>
      <div className="relative inline-flex" onBlur={fecharMenuAoPerderFoco} ref={gatilhoRef}>
        <button
          aria-expanded={menuAberto}
          aria-haspopup="menu"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          title={`Ações de ${cliente.nome}`}
          type="button"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          <span className="sr-only">Abrir ações de {cliente.nome}</span>
        </button>

        {menuAberto ? (
          <div
            className={`absolute right-0 z-40 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-1 shadow-md ${abrirParaCima ? "bottom-10" : "top-10"}`}
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
              Ver cadastro
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
              Atualizar cadastro
            </button>
            {podeExcluir ? (
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
                Excluir cliente
              </button>
            ) : (
              <p className="px-3 py-2 text-xs text-muted" role="note">
                Exclusão restrita ao perfil profissional.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <Modal state={modalVisualizacao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo="Cadastro do cliente">
              <VisualizacaoCliente cliente={cliente} medicamentosEmUso={medicamentosEmUso} />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalEdicao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo="Atualizar cliente">
              <FecharModalProvider value={modalEdicao.close}>
                <FormularioCliente cliente={cliente} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo="Excluir cliente">
              <form action={formAction} className="grid gap-4">
                <input name="clienteId" type="hidden" value={cliente.id} />
                <ParteModalAnimada ordem={2}>
                  <p className="text-sm text-foreground">
                    Você está prestes a excluir {cliente.nome}. Essa ação remove o cadastro e os
                    vínculos clínicos associados, incluindo agenda, sessões, fichas, medidas,
                    documentos, medicamentos, fotos, pacotes e biometria.
                  </p>
                </ParteModalAnimada>
                <ParteModalAnimada ordem={3}>
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
                </ParteModalAnimada>

                {state.status === "erro" && state.mensagem ? (
                  <p className="text-sm font-medium text-perigo" role="alert">
                    {state.mensagem}
                  </p>
                ) : null}

                <ParteModalAnimada ordem={4}>
                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    <button
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                      onClick={() => {
                        setConfirmado(false);
                        modalExclusao.close();
                      }}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                </ParteModalAnimada>
              </form>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
