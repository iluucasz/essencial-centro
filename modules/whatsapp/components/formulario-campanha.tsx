"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { LoaderCircle, Search, Send, Tag, Users } from "lucide-react";

import { ConteudoModal, ParteModalAnimada } from "@/components/ui/modal-formulario";
import { enviarCampanhaMensagem, type EstadoEnvioCampanha } from "@/modules/whatsapp/actions";
import { agruparClientesPorTag, filtrarClientesCampanha } from "@/modules/whatsapp/filtro-clientes";
import { personalizarMensagem } from "@/modules/whatsapp/mensagens";
import type { MensagemPredefinida } from "@/modules/whatsapp/schema";

import { CampoAnexoWhatsApp } from "./campo-anexo";
import { PreviaMensagemWhatsApp } from "./previa-mensagem-whatsapp";

const estadoInicial: EstadoEnvioCampanha = { status: "inicial" };
const NOME_EXEMPLO = "Maria";

type ClienteParaCampanha = {
  id: string;
  nome: string;
  telefone: string | null;
  tag: string | null;
};

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
    return filtrarClientesCampanha(clientes, busca);
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
            placeholder="Buscar cliente por nome ou tag"
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
                  onChange={() => onAlternar(c.id)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1 truncate">{c.nome}</span>
                {c.tag ? (
                  <span className="shrink-0 rounded-full bg-lilas/25 px-2 py-0.5 text-xs font-medium text-roxo">
                    {c.tag}
                  </span>
                ) : null}
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function SeletorTag({
  grupos,
  tagSelecionada,
  onSelecionar,
}: {
  grupos: ReturnType<typeof agruparClientesPorTag<ClienteParaCampanha>>;
  tagSelecionada: string;
  onSelecionar: (tag: string) => void;
}) {
  const grupoSelecionado = grupos.find((grupo) => grupo.tag === tagSelecionada);

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-creme/40 p-3">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="tag-destinatarios">
            Tag dos clientes
          </label>
          <select
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            id="tag-destinatarios"
            onChange={(event) => onSelecionar(event.target.value)}
            value={tagSelecionada}
          >
            <option value="">Selecione uma tag</option>
            {grupos.map((grupo) => (
              <option key={grupo.tag} value={grupo.tag}>
                {grupo.tag} ({grupo.clientes.length})
              </option>
            ))}
          </select>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Tag className="size-4 shrink-0 text-roxo" aria-hidden="true" />
          {grupoSelecionado
            ? `${grupoSelecionado.clientes.length} cliente${grupoSelecionado.clientes.length === 1 ? "" : "s"} com telefone receberá${grupoSelecionado.clientes.length === 1 ? "" : "ão"} a mensagem.`
            : "Escolha uma tag para selecionar os destinatários."}
        </p>
      </div>
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
                <p className="mt-3 rounded-2xl rounded-tl-sm bg-brand/5 p-3 text-sm leading-relaxed text-foreground">
                  <PreviaMensagemWhatsApp mensagem={personalizarMensagem(conteudo, NOME_EXEMPLO)} />
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
  const [destinatarios, setDestinatarios] = useState<"todos" | "selecionados" | "tag">("todos");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [tagSelecionada, setTagSelecionada] = useState("");

  const modeloSelecionado = mensagensPredefinidas.find((m) => m.id === mensagemPredefinidaId);
  const gruposPorTag = useMemo(() => agruparClientesPorTag(clientes), [clientes]);

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

  function selecionarTag(tag: string) {
    setTagSelecionada(tag);
    const grupo = gruposPorTag.find((item) => item.tag === tag);
    setSelecionados(new Set(grupo?.clientes.map((cliente) => cliente.id) ?? []));
  }

  function escolherModoTag() {
    setDestinatarios("tag");
    selecionarTag(tagSelecionada || gruposPorTag[0]?.tag || "");
  }

  const totalDestinatarios = destinatarios === "todos" ? clientes.length : selecionados.size;
  const conteudoValido = conteudo.trim().length >= 2;
  const podeAbrirConfirmacao = conteudoValido && totalDestinatarios > 0;

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid min-w-0 gap-4" id="form-campanha">
        <input name="mensagemPredefinidaId" type="hidden" value={mensagemPredefinidaId} />
        <input
          name="destinatarios"
          type="hidden"
          value={destinatarios === "todos" ? "todos" : "selecionados"}
        />
        {destinatarios !== "todos"
          ? Array.from(selecionados).map((clienteId) => (
              <input key={clienteId} name="clienteIds" type="hidden" value={clienteId} />
            ))
          : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] xl:items-start">
          <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Conteúdo da mensagem</h3>
              <p className="mt-1 text-xs text-muted">
                Escreva do zero ou carregue um modelo já salvo.
              </p>
            </div>

            {mensagensPredefinidas.length > 0 ? (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="modelo">
                  Mensagem predefinida (opcional)
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
                className="min-h-52 w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
                id="conteudo-campanha"
                maxLength={1000}
                name="conteudo"
                onChange={(event) => setConteudo(event.target.value)}
                placeholder="Ex.: Olá, {nome}! Preparamos uma condição especial pra você..."
                value={conteudo}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <p>
                  Use <code className="rounded bg-creme px-1">{"{nome}"}</code> para o primeiro nome
                  e <code className="rounded bg-creme px-1">*texto*</code> para negrito.
                </p>
                <span>{conteudo.length}/1000</span>
              </div>
            </div>

            <CampoAnexoWhatsApp
              anexoAtual={
                modeloSelecionado?.arquivoUrl && modeloSelecionado.arquivoNome
                  ? { url: modeloSelecionado.arquivoUrl, nome: modeloSelecionado.arquivoNome }
                  : null
              }
              idBase="campanha"
              key={mensagemPredefinidaId}
              resetToken={estado}
            />
            {estado.status === "erro" && estado.campos?.arquivo ? (
              <p className="text-sm font-medium text-perigo" role="alert">
                {estado.campos.arquivo[0]}
              </p>
            ) : null}
          </section>

          <fieldset className="grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4">
            <legend className="sr-only">Destinatários</legend>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Destinatários</h3>
              <p className="mt-1 text-xs text-muted">Defina quem receberá esta mensagem.</p>
            </div>

            <div className="grid gap-2">
              <label className="cursor-pointer">
                <input
                  checked={destinatarios === "todos"}
                  className="peer sr-only"
                  name="modo-destinatarios"
                  onChange={() => setDestinatarios("todos")}
                  type="radio"
                />
                <span className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition peer-checked:border-roxo peer-checked:bg-lilas/15 peer-checked:text-roxo peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-roxo hover:bg-creme/50">
                  <Users className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">Todos com telefone</span>
                  <strong className="shrink-0">{clientes.length}</strong>
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  checked={destinatarios === "selecionados"}
                  className="peer sr-only"
                  name="modo-destinatarios"
                  onChange={() => setDestinatarios("selecionados")}
                  type="radio"
                />
                <span className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition peer-checked:border-roxo peer-checked:bg-lilas/15 peer-checked:text-roxo peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-roxo hover:bg-creme/50">
                  <Search className="size-4 shrink-0" aria-hidden="true" />
                  Escolher clientes
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  checked={destinatarios === "tag"}
                  className="peer sr-only"
                  name="modo-destinatarios"
                  onChange={escolherModoTag}
                  type="radio"
                />
                <span className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition peer-checked:border-roxo peer-checked:bg-lilas/15 peer-checked:text-roxo peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-roxo hover:bg-creme/50">
                  <Tag className="size-4 shrink-0" aria-hidden="true" />
                  Escolher por tag
                </span>
              </label>
            </div>

            {destinatarios === "todos" ? (
              <p className="rounded-xl bg-brand/5 p-3 text-sm leading-relaxed text-muted">
                A mensagem será enviada aos {clientes.length} clientes que possuem telefone
                cadastrado.
              </p>
            ) : null}
            {destinatarios === "selecionados" ? (
              <SeletorClientes
                clientes={clientes}
                onAlternar={alternarCliente}
                onLimpar={() => setSelecionados(new Set())}
                onSelecionarTodos={(ids) => setSelecionados(new Set(ids))}
                selecionados={selecionados}
              />
            ) : null}
            {destinatarios === "tag" ? (
              <SeletorTag
                grupos={gruposPorTag}
                onSelecionar={selecionarTag}
                tagSelecionada={tagSelecionada}
              />
            ) : null}
          </fieldset>
        </div>

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

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-creme/40 p-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Users className="size-4 text-roxo" aria-hidden="true" />
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
