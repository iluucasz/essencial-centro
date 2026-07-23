"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  FilePlus2,
  LoaderCircle,
  MessageCircle,
  PenLine,
  TriangleAlert,
} from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  criarFichaDeModelo,
  enviarFichaPorWhatsApp,
  type ResultadoEnvioWhatsApp,
} from "@/modules/fichas/actions";
import { campoEhInput, type CampoModelo } from "@/modules/fichas/campos";

import { FormularioDinamico } from "./formulario-dinamico";

export type ModeloParaSeletor = {
  id: string;
  nome: string;
  descricao: string | null;
  campos: CampoModelo[];
};

type ServicoOpcao = { id: string; nome: string };

type Acao = "escolher" | "preencher" | "whatsapp";

function EnvioWhatsApp({ clienteId, modelo }: { clienteId: string; modelo: ModeloParaSeletor }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEnvioWhatsApp | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function enviar() {
    setEnviando(true);
    try {
      const retorno = await enviarFichaPorWhatsApp({ clienteId, modeloFichaId: modelo.id });
      setResultado(retorno);
      if (retorno.status === "sucesso") router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  if (resultado?.status === "sucesso") {
    return (
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
          <Check className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {resultado.enviado
              ? "Link enviado para o WhatsApp do cliente. A ficha aparece como “Aguardando cliente” até ser preenchida."
              : "Ficha criada, mas o envio automático não foi possível. Copie o link abaixo e envie ao cliente."}
          </p>
        </div>
        {resultado.aviso ? (
          <p className="flex items-center gap-2 text-xs text-dourado">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            {resultado.aviso}
          </p>
        ) : null}
        <div className="grid gap-2 rounded-2xl border border-border bg-creme/60 p-3">
          <p className="truncate text-xs text-muted">{resultado.url}</p>
          <button
            className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme"
            onClick={() => copiar(resultado.url)}
            type="button"
          >
            {copiado ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copiado ? "Link copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-roxo/20 bg-lilas/10 p-4">
        <MessageCircle className="mt-0.5 size-5 shrink-0 text-roxo" aria-hidden="true" />
        <p className="text-sm text-foreground">
          Vamos enviar o link da ficha <span className="font-semibold">{modelo.nome}</span> para o
          WhatsApp do cliente preencher. Confirma?
        </p>
      </div>
      {resultado?.status === "erro" ? (
        <p
          className="rounded-lg bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {resultado.mensagem}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 disabled:opacity-60"
          disabled={enviando}
          onClick={enviar}
          type="button"
        >
          {enviando ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <MessageCircle className="size-4" aria-hidden />
          )}
          Enviar para o WhatsApp
        </button>
      </div>
    </div>
  );
}

function BotaoAcao({
  icone,
  titulo,
  descricao,
  onClick,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-roxo/30 hover:bg-lilas/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/20 text-roxo transition group-hover:bg-roxo group-hover:text-white">
        {icone}
      </span>
      <span>
        <span className="block font-semibold text-foreground">{titulo}</span>
        <span className="mt-0.5 block text-sm text-muted">{descricao}</span>
      </span>
    </button>
  );
}

export function SeletorModeloFicha({
  clienteId,
  modelos,
  servicos,
}: {
  clienteId: string;
  modelos: ModeloParaSeletor[];
  servicos: ServicoOpcao[];
}) {
  const router = useRouter();
  const state = useOverlayState();
  const [selecionado, setSelecionado] = useState<ModeloParaSeletor | null>(null);
  const [acao, setAcao] = useState<Acao>("escolher");

  function fechar() {
    state.close();
    setSelecionado(null);
    setAcao("escolher");
  }

  function escolher(modelo: ModeloParaSeletor) {
    setSelecionado(modelo);
    setAcao("escolher");
  }

  const titulo = selecionado ? selecionado.nome : "Nova ficha";

  return (
    <Modal state={state}>
      <Modal.Trigger className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto">
        <FilePlus2 className="size-4" aria-hidden />
        Nova ficha
      </Modal.Trigger>
      <Modal.Backdrop variant="opaque">
        <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
          <ConteudoModal titulo={titulo}>
            {!selecionado ? (
              modelos.length === 0 ? (
                <p className="rounded-2xl border border-border bg-creme p-4 text-sm text-muted">
                  Nenhum modelo de ficha disponível. Crie um modelo primeiro em &quot;Criar
                  modelo&quot;.
                </p>
              ) : (
                <div className="grid gap-2">
                  <p className="text-sm text-muted">Escolha um modelo:</p>
                  <ul className="grid gap-2">
                    {modelos.map((modelo) => {
                      const total = modelo.campos.filter((campo) =>
                        campoEhInput(campo.tipo),
                      ).length;

                      return (
                        <li key={modelo.id}>
                          <button
                            className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-roxo/30 hover:bg-lilas/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                            onClick={() => escolher(modelo)}
                            type="button"
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lilas/20 text-roxo transition group-hover:bg-roxo group-hover:text-white">
                              <ClipboardList className="size-5" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-foreground">
                                {modelo.nome}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {modelo.descricao?.trim() || `${total} campos`}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            ) : (
              <div className="grid gap-4">
                <button
                  className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo transition hover:text-brand"
                  onClick={() => (acao === "escolher" ? setSelecionado(null) : setAcao("escolher"))}
                  type="button"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  {acao === "escolher" ? "Escolher outro modelo" : "Voltar"}
                </button>

                {acao === "escolher" ? (
                  <div className="grid gap-2">
                    <BotaoAcao
                      descricao="A profissional preenche a ficha agora."
                      icone={<PenLine className="size-5" aria-hidden />}
                      onClick={() => setAcao("preencher")}
                      titulo="Preencher ficha"
                    />
                    <BotaoAcao
                      descricao="Enviar link para o cliente preencher."
                      icone={<MessageCircle className="size-5" aria-hidden />}
                      onClick={() => setAcao("whatsapp")}
                      titulo="Enviar para WhatsApp"
                    />
                  </div>
                ) : null}

                {acao === "preencher" ? (
                  <FormularioDinamico
                    aoEnviar={async ({ respostas, servicoId }) => {
                      const resultado = await criarFichaDeModelo({
                        clienteId,
                        modeloFichaId: selecionado.id,
                        servicoId,
                        respostas,
                      });

                      if (resultado.status === "sucesso") {
                        fechar();
                        router.refresh();
                      }

                      return resultado;
                    }}
                    campos={selecionado.campos}
                    rotuloEnviar="Salvar ficha"
                    servicos={servicos}
                  />
                ) : null}

                {acao === "whatsapp" ? (
                  <EnvioWhatsApp clienteId={clienteId} modelo={selecionado} />
                ) : null}
              </div>
            )}
          </ConteudoModal>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
