"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { LoaderCircle, Search, Tag } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { atribuirTagClientes, type EstadoAtribuicaoTag } from "@/modules/clientes/tag-actions";

export type ClienteParaTag = { id: string; nome: string; tag: string | null };

const estadoInicial: EstadoAtribuicaoTag = { status: "inicial" };

function FormularioAtribuirTag({
  clientes,
  fechar,
}: {
  clientes: ClienteParaTag[];
  fechar: () => void;
}) {
  const [estado, formAction, pendente] = useActionState(atribuirTagClientes, estadoInicial);
  const [nomeTag, setNomeTag] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const tagsExistentes = useMemo(
    () =>
      Array.from(new Set(clientes.map((cliente) => cliente.tag?.trim()).filter(Boolean))).sort(
        (a, b) => a!.localeCompare(b!, "pt-BR"),
      ) as string[],
    [clientes],
  );
  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return clientes;
    return clientes.filter((cliente) => cliente.nome.toLocaleLowerCase("pt-BR").includes(termo));
  }, [busca, clientes]);

  useEffect(() => {
    if (estado.status === "sucesso") fechar();
  }, [estado.status, fechar]);

  function escolherTag(tag: string) {
    setNomeTag(tag);
    setSelecionados(
      new Set(
        clientes
          .filter(
            (cliente) => cliente.tag?.localeCompare(tag, "pt-BR", { sensitivity: "base" }) === 0,
          )
          .map((cliente) => cliente.id),
      ),
    );
  }

  function alternarCliente(id: string) {
    setSelecionados((atuais) => {
      const proximos = new Set(atuais);
      if (proximos.has(id)) proximos.delete(id);
      else proximos.add(id);
      return proximos;
    });
  }

  return (
    <form action={formAction} className="grid gap-5">
      {Array.from(selecionados).map((clienteId) => (
        <input key={clienteId} name="clienteIds" type="hidden" value={clienteId} />
      ))}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground" htmlFor="nome-tag">
          Nome da tag
        </label>
        <input
          autoFocus
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20"
          id="nome-tag"
          maxLength={160}
          name="tag"
          onChange={(event) => setNomeTag(event.target.value)}
          placeholder="Ex.: VIP ou Pós-operatório"
          required
          value={nomeTag}
        />
        {estado.campos?.tag ? <p className="text-sm text-perigo">{estado.campos.tag[0]}</p> : null}
      </div>

      {tagsExistentes.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Tags existentes
          </p>
          <div className="flex flex-wrap gap-2">
            {tagsExistentes.map((tag) => (
              <button
                className="rounded-full border border-roxo/20 bg-lilas/15 px-3 py-1.5 text-xs font-medium text-roxo transition hover:bg-lilas/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                key={tag}
                onClick={() => escolherTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Clientes participantes</h3>
            <p className="mt-1 text-xs text-muted">
              Uma nova atribuição substitui a tag anterior do cliente.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-roxo">
            {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
          </span>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar cliente pelo nome"
            type="search"
            value={busca}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 text-xs">
          <button
            className="font-medium text-roxo hover:underline"
            onClick={() =>
              setSelecionados(
                (atuais) => new Set([...atuais, ...clientesFiltrados.map((cliente) => cliente.id)]),
              )
            }
            type="button"
          >
            Selecionar resultados
          </button>
          <button
            className="font-medium text-muted hover:underline"
            onClick={() => setSelecionados(new Set())}
            type="button"
          >
            Limpar
          </button>
        </div>

        <ul className="grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-border bg-creme/30 p-2">
          {clientesFiltrados.length === 0 ? (
            <li className="p-3 text-center text-sm text-muted">Nenhum cliente encontrado.</li>
          ) : (
            clientesFiltrados.map((cliente) => (
              <li key={cliente.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-surface">
                  <input
                    checked={selecionados.has(cliente.id)}
                    className="size-4 shrink-0 rounded border-border text-roxo focus:ring-roxo"
                    onChange={() => alternarCliente(cliente.id)}
                    type="checkbox"
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">{cliente.nome}</span>
                  {cliente.tag ? (
                    <span className="shrink-0 rounded-full bg-lilas/25 px-2 py-0.5 text-xs font-medium text-roxo">
                      {cliente.tag}
                    </span>
                  ) : null}
                </label>
              </li>
            ))
          )}
        </ul>
        {estado.campos?.clienteIds ? (
          <p className="text-sm text-perigo">{estado.campos.clienteIds[0]}</p>
        ) : null}
      </div>

      {estado.status === "erro" && estado.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {estado.mensagem}
        </p>
      ) : null}

      <div className="flex border-t border-border/70 pt-4 sm:justify-end">
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={pendente}
          type="submit"
        >
          {pendente ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Tag className="size-4" aria-hidden="true" />
          )}
          Atribuir tag
        </button>
      </div>
    </form>
  );
}

export function ModalAtribuirTag({ clientes }: { clientes: ClienteParaTag[] }) {
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const state = useOverlayState({
    onOpenChange: (aberto) => {
      if (!aberto) setChaveFormulario((atual) => atual + 1);
    },
  });

  return (
    <Modal state={state}>
      <Modal.Trigger className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-roxo/25 bg-surface px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto">
        <Tag className="size-4" aria-hidden="true" />
        Atribuir tag
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
          <ConteudoModal titulo="Atribuir tag aos clientes">
            <FormularioAtribuirTag clientes={clientes} fechar={state.close} key={chaveFormulario} />
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
