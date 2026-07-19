"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Modal, Popover, useOverlayState } from "@heroui/react";
import { LoaderCircle, Plus, Settings2, Trash2 } from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  criarOpcaoServico,
  excluirOpcaoServico,
  type EstadoCriacaoOpcaoServico,
  type EstadoExclusaoOpcaoServico,
} from "@/modules/servicos/actions";
import type { TipoOpcaoServico } from "@/modules/servicos/schema";

import type { OpcaoServicoResumo } from "./formulario-servico";

const estadoInicial: EstadoExclusaoOpcaoServico = { status: "inicial" };
const estadoInicialCriacao: EstadoCriacaoOpcaoServico = { status: "inicial" };

/** Botão + popover pra adicionar uma opção de "Grupo"/"Periodicidade" na hora — grava direto no
 * banco (sem esperar o serviço inteiro ser salvo) e já seleciona o valor novo no select, via
 * `onAdicionada`. Substitui o antigo fluxo "Outro" com input revelado dentro do formulário, que
 * desalinhava o grid quando aparecia.
 *
 * Chama a action diretamente no handler de submit (em vez de `useActionState` + `useEffect`)
 * pra poder fechar o popover e limpar o campo assim que o resultado chega, sem cair no problema
 * de disparar `setState` de dentro de um efeito. */
export function AdicionarOpcaoServico({
  onAdicionada,
  tipo,
}: {
  onAdicionada: (opcao: { id: string; nome: string }) => void;
  tipo: TipoOpcaoServico;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nomeDigitado = nome;
    setErro(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("tipo", tipo);
      formData.set("nome", nomeDigitado);

      const resultado = await criarOpcaoServico(estadoInicialCriacao, formData);

      if (resultado.status === "sucesso" && resultado.opcao) {
        onAdicionada(resultado.opcao);
        setNome("");
        setAberto(false);
        return;
      }

      setErro(resultado.mensagem ?? "Não foi possível adicionar.");
    });
  }

  return (
    <Popover isOpen={aberto} onOpenChange={setAberto}>
      <Popover.Trigger className="inline-flex items-center gap-1 text-xs font-medium text-roxo transition hover:underline">
        <Plus className="size-3.5" aria-hidden="true" />
        Adicionar novo
      </Popover.Trigger>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="grid w-64 gap-2 p-3">
          <form className="grid gap-2" onSubmit={aoEnviar}>
            <input
              autoFocus
              className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
              onChange={(event) => setNome(event.target.value)}
              placeholder="Digite o novo valor"
              value={nome}
            />
            {erro ? <p className="text-xs text-perigo">{erro}</p> : null}
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={pending || nome.trim().length < 2}
              type="submit"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              Adicionar
            </button>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function BotaoExcluirOpcao({ opcao }: { opcao: OpcaoServicoResumo }) {
  const [state, formAction, pending] = useActionState(excluirOpcaoServico, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input name="id" type="hidden" value={opcao.id} />
      <button
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-perigo/10 hover:text-perigo disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        title={`Excluir ${opcao.nome}`}
        type="submit"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">Excluir {opcao.nome}</span>
      </button>
      {state.status === "erro" && state.mensagem ? (
        <p className="text-xs text-perigo">{state.mensagem}</p>
      ) : null}
    </form>
  );
}

/** Botão + modal pra listar e excluir opções de "Grupo"/"Periodicidade" criadas via "Outro" no
 * formulário de serviço — as opções padrão (do catálogo original) não têm botão de excluir. */
export function GerenciarOpcoesServico({
  opcoes,
  titulo,
}: {
  opcoes: OpcaoServicoResumo[];
  titulo: string;
}) {
  const modal = useOverlayState();

  return (
    <>
      <button
        className="inline-flex items-center gap-1 text-xs font-medium text-roxo transition hover:underline"
        onClick={modal.open}
        type="button"
      >
        <Settings2 className="size-3.5" aria-hidden="true" />
        Gerenciar
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo={titulo}>
              {opcoes.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma opção cadastrada ainda.</p>
              ) : (
                <ul className="grid gap-1">
                  {opcoes.map((opcao) => (
                    <li
                      key={opcao.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground"
                    >
                      <span className="truncate">{opcao.nome}</span>
                      {opcao.padrao ? (
                        <span className="shrink-0 text-xs text-muted">Padrão</span>
                      ) : (
                        <BotaoExcluirOpcao opcao={opcao} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
