"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { LoaderCircle, Search, Send, Users } from "lucide-react";

import { ConteudoModal, ParteModalAnimada } from "@/components/ui/modal-formulario";
import { enviarCampanhaMensagem, type EstadoEnvioCampanha } from "@/modules/whatsapp/actions";
import { personalizarMensagem } from "@/modules/whatsapp/mensagens";
import type { MensagemPredefinida } from "@/modules/whatsapp/schema";

const estadoInicial: EstadoEnvioCampanha = { status: "inicial" };
const NOME_EXEMPLO = "Maria";

type ClienteParaCampanha = { id: string; nome: string; telefone: string | null };

function SeletorClientes({
  clientes,
  selecionados,
  onAlternar,
  onSelecionarTodos,
  onLimpar,
}: {
  clientes: ClienteParaCampanha[];
  selecionados: Set<string>;
  onAlternar: (id: string) => void;
  onSelecionarTodos: (ids: string[]) => void;
  onLimpar: () => void;
}) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((c) => c.nome.toLowerCase().includes(termo));
  }, [clientes, busca]);

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-creme/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar cliente pelo nome"
            type="text"
            value={busca}
          />
        </div>
        <button
          className="text-xs font-medium text-roxo hover:underline"
          onClick={() => onSelecionarTodos(filtrados.map((c) => c.id))}
          type="button"
        >
          Selecionar {busca ? "resultado" : "todos"}
        </button>
        <button
          className="text-xs font-medium text-muted hover:underline"
          onClick={onLimpar}
          type="button"
        >
          Limpar
        </button>
      </div>

      <ul className="grid max-h-56 min-w-0 gap-1 overflow-y-auto">
        {filtrados.length === 0 ? (
          <li className="p-2 text-sm text-muted">Nenhum cliente encontrado.</li>
        ) : (
          filtrados.map((c) => (
            <li key={c.id}>
              <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition hover:bg-surface">
                <input
                  checked={selecionados.has(c.id)}
                  className="size-4 shrink-0 rounded border-border text-roxo focus:ring-roxo"
                  name="clienteIds"
                  onChange={() => onAlternar(c.id)}
                  type="checkbox"
                  value={c.id}
                />
                <span className="min-w-0 truncate">{c.nome}</span>
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function ModalConfirmacaoEnvio({
  state,
  fechar,
  conteudo,
  totalDestinatarios,
  estado,
  pendente,
}: {
  state: ReturnType<typeof useOverlayState>;
  fechar: () => void;
  conteudo: string;
  totalDestinatarios: number;
  estado: EstadoEnvioCampanha;
  pendente: boolean;
}) {
  useEffect(() => {
    if (estado.status === "sucesso") fechar();
  }, [estado.status, fechar]);

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="sm">
          <ConteudoModal titulo="Confirmar envio">
            <div className="grid gap-4">
              <ParteModalAnimada ordem={2}>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="size-4 text-roxo" aria-hidden="true" />
                  Vai enviar para{" "}
                  <strong>
                    {totalDestinatarios} cliente{totalDestinatarios === 1 ? "" : "s"}
                  </strong>
                  .
                </p>
                <p className="mt-3 rounded-2xl rounded-tl-sm bg-brand/5 p-3 text-sm break-words whitespace-pre-line text-foreground">
                  {personalizarMensagem(conteudo, NOME_EXEMPLO)}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Exemplo com o nome trocado — cada cliente recebe com o próprio nome.
                </p>
              </ParteModalAnimada>

              {estado.status === "erro" && estado.mensagem ? (
                <p className="text-sm font-medium text-perigo" role="alert">
                  {estado.mensagem}
                </p>
              ) : null}

              <ParteModalAnimada ordem={3}>
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                    onClick={fechar}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={pendente}
                    form="form-campanha"
                    type="submit"
                  >
                    {pendente ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="size-4" aria-hidden="true" />
                    )}
                    Confirmar e enviar
                  </button>
                </div>
              </ParteModalAnimada>
            </div>
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function FormularioCampanha({
  mensagensPredefinidas,
  clientes,
}: {
  mensagensPredefinidas: MensagemPredefinida[];
  clientes: ClienteParaCampanha[];
}) {
  const [estado, formAction, pendente] = useActionState(enviarCampanhaMensagem, estadoInicial);
  const modalConfirmacao = useOverlayState();

  const [mensagemPredefinidaId, setMensagemPredefinidaId] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [destinatarios, setDestinatarios] = useState<"todos" | "selecionados">("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  function selecionarModelo(id: string) {
    setMensagemPredefinidaId(id);

    const modelo = mensagensPredefinidas.find((m) => m.id === id);
    if (modelo) setConteudo(modelo.conteudo);
  }

  function alternarCliente(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  const totalDestinatarios = destinatarios === "todos" ? clientes.length : selecionados.size;
  const conteudoValido = conteudo.trim().length >= 2;
  const podeAbrirConfirmacao = conteudoValido && totalDestinatarios > 0;

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid min-w-0 gap-4" id="form-campanha">
        <input name="mensagemPredefinidaId" type="hidden" value={mensagemPredefinidaId} />
        <input name="destinatarios" type="hidden" value={destinatarios} />

        {mensagensPredefinidas.length > 0 ? (
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="modelo">
              Partir de uma mensagem predefinida (opcional)
            </label>
            <select
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              id="modelo"
              onChange={(event) => selecionarModelo(event.target.value)}
              value={mensagemPredefinidaId}
            >
              <option value="">Escrever do zero</option>
              {mensagensPredefinidas.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.titulo}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="conteudo-campanha">
            Mensagem
          </label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="conteudo-campanha"
            maxLength={1000}
            name="conteudo"
            onChange={(event) => setConteudo(event.target.value)}
            placeholder="Ex.: Olá, {nome}! Preparamos uma condição especial pra você..."
            value={conteudo}
          />
          <p className="text-xs text-muted">
            Use <code className="rounded bg-creme px-1">{"{nome}"}</code> onde quiser o primeiro
            nome do cliente.
          </p>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-foreground">Destinatários</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                checked={destinatarios === "todos"}
                className="size-4 text-roxo focus:ring-roxo"
                name="modo-destinatarios"
                onChange={() => setDestinatarios("todos")}
                type="radio"
              />
              Todos os clientes com telefone ({clientes.length})
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                checked={destinatarios === "selecionados"}
                className="size-4 text-roxo focus:ring-roxo"
                name="modo-destinatarios"
                onChange={() => setDestinatarios("selecionados")}
                type="radio"
              />
              Escolher clientes
            </label>
          </div>

          {destinatarios === "selecionados" ? (
            <SeletorClientes
              clientes={clientes}
              onAlternar={alternarCliente}
              onLimpar={() => setSelecionados(new Set())}
              onSelecionarTodos={(ids) => setSelecionados(new Set(ids))}
              selecionados={selecionados}
            />
          ) : null}
        </fieldset>

        {estado.status === "erro" && estado.campos?.clienteIds ? (
          <p className="text-sm font-medium text-perigo" role="alert">
            {estado.campos.clienteIds[0]}
          </p>
        ) : null}
        {estado.status === "sucesso" && estado.mensagem ? (
          <p
            className="rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-brand"
            role="status"
          >
            {estado.mensagem}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="text-sm text-muted">
            {totalDestinatarios} destinatário{totalDestinatarios === 1 ? "" : "s"} selecionado
            {totalDestinatarios === 1 ? "" : "s"}
          </p>
          <button
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!podeAbrirConfirmacao}
            onClick={modalConfirmacao.open}
            type="button"
          >
            <Send className="size-4" aria-hidden="true" />
            Enviar
          </button>
        </div>
      </form>

      <ModalConfirmacaoEnvio
        conteudo={conteudo}
        estado={estado}
        fechar={modalConfirmacao.close}
        pendente={pendente}
        state={modalConfirmacao}
        totalDestinatarios={totalDestinatarios}
      />
    </div>
  );
}
