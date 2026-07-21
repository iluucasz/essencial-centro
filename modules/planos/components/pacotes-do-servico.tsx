"use client";

import { useEffect, useRef } from "react";
import { Modal, useOverlayState } from "@heroui/react";
import { PackagePlus, Plus, Trash2 } from "lucide-react";

import { ConteudoModal, FecharModalProvider } from "@/components/ui/modal-formulario";
import { removerPlano } from "@/modules/planos/actions";

import { FormularioPlano } from "./formulario-plano";

type PlanoResumo = {
  id: string;
  nome: string | null;
  quantidadeSessoes: number;
  valorCentavos: number;
  ativo: boolean;
};

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarValor(valorCentavos: number) {
  return formatadorMoeda.format(valorCentavos / 100);
}

export function PacotesDoServico({
  planos,
  podeGerenciar,
  promptInicial = false,
  servicoId,
}: {
  planos: PlanoResumo[];
  podeGerenciar: boolean;
  promptInicial?: boolean;
  servicoId: string;
}) {
  const modalCriar = useOverlayState();
  const modalPrompt = useOverlayState();
  const jaOfereceu = useRef(false);

  // Após criar o serviço (redirect com ?novo=1), oferece criar pacotes uma única vez.
  useEffect(() => {
    if (promptInicial && !jaOfereceu.current && planos.length === 0) {
      jaOfereceu.current = true;
      modalPrompt.open();
    }
  }, [promptInicial, planos.length, modalPrompt]);

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pacotes do serviço</h2>
          <p className="mt-1 text-sm text-muted">
            Faixas de sessões oferecidas neste serviço. Sem pacotes = só sessão avulsa.
          </p>
        </div>
        {podeGerenciar ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={() => modalCriar.open()}
            type="button"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo pacote
          </button>
        ) : null}
      </div>

      {planos.length === 0 ? (
        <p className="pt-5 text-sm text-muted">
          Nenhum pacote cadastrado — este serviço é oferecido apenas como sessão avulsa.
        </p>
      ) : (
        <ul className="grid gap-3 pt-5 sm:grid-cols-2">
          {planos.map((plano) => (
            <li
              className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-creme/40 p-4"
              key={plano.id}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {plano.nome ?? `Pacote ${plano.quantidadeSessoes} sessões`}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {plano.quantidadeSessoes} sessões · {formatarValor(plano.valorCentavos)}
                  {plano.ativo ? "" : " · inativo"}
                </p>
              </div>
              {podeGerenciar ? (
                <form action={removerPlano}>
                  <input name="planoId" type="hidden" value={plano.id} />
                  <input name="servicoId" type="hidden" value={servicoId} />
                  <button
                    aria-label={`Excluir pacote ${plano.nome ?? plano.quantidadeSessoes + " sessões"}`}
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-perigo/10 hover:text-perigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo"
                    type="submit"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal state={modalCriar}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo="Novo pacote">
              <FecharModalProvider value={modalCriar.close}>
                <FormularioPlano servicoId={servicoId} />
              </FecharModalProvider>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalPrompt}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal titulo="Deseja criar pacotes para esse serviço?">
              <div className="grid gap-4">
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <PackagePlus className="mt-0.5 size-5 shrink-0 text-roxo" aria-hidden="true" />
                  Você pode cadastrar faixas de pacote (ex.: 5 ou 10 sessões) com preço próprio. Se
                  o serviço for só avulso, é só pular.
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => modalPrompt.close()}
                    type="button"
                  >
                    Agora não
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    onClick={() => {
                      modalPrompt.close();
                      modalCriar.open();
                    }}
                    type="button"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Sim, criar pacote
                  </button>
                </div>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </section>
  );
}
