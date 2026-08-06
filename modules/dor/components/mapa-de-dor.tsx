"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { LoaderCircle, MousePointerClick, Trash2 } from "lucide-react";

import { ancorasDaFace, chaveAncora } from "../ancoras";
import { corCssDaIntensidade } from "../cores";
import { cn } from "@/lib/utils";
import { descreverRegiao, faixaIntensidade } from "../regioes";
import { rotulosOrigemRegistroDor } from "../schema";
import type { EstadoRegistroDor } from "../actions";
import type { AncoraSelecionada, PontoMarcado } from "./corpo-3d";

/**
 * O three.js entra por `next/dynamic` com `ssr: false`: são ~600KB que só quem abre a aba baixa, e
 * WebGL não existe no servidor.
 */
const Corpo3D = dynamic(() => import("./corpo-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      Carregando modelo do corpo…
    </div>
  ),
});

export type PontoDorNaTela = PontoMarcado & {
  origem: "profissional" | "cliente";
  observacao: string | null;
  registradoEm: string;
};

type AcaoRegistro = (estado: EstadoRegistroDor, formData: FormData) => Promise<EstadoRegistroDor>;

const estadoInicial: EstadoRegistroDor = { status: "inicial" };

/**
 * Exclusão em componente próprio pra ter `useActionState` por linha: `<form action>` cru descartaria
 * o estado devolvido pela action, e um erro de autorização sumiria sem aviso.
 */
function BotaoExcluirPonto({
  clienteId,
  descricao,
  excluir,
  id,
}: {
  clienteId: string;
  descricao: string;
  excluir: (formData: FormData) => Promise<EstadoRegistroDor>;
  id: string;
}) {
  const [estado, acao, enviando] = useActionState(
    async (_: EstadoRegistroDor, formData: FormData) => excluir(formData),
    estadoInicial,
  );

  return (
    <form action={acao} className="shrink-0">
      <input name="id" type="hidden" value={id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <button
        aria-label={`Remover ponto em ${descricao}`}
        className="rounded-lg p-2 text-muted transition hover:bg-perigo/10 hover:text-perigo disabled:opacity-50"
        disabled={enviando}
        type="submit"
      >
        {enviando ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
      </button>
      {estado.status === "erro" ? (
        <span className="sr-only" role="alert">
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}

export function MapaDeDor({
  clienteId,
  pontos,
  registrar,
  excluir,
  comoCliente = false,
}: {
  /** Ausente no portal: lá o cliente vem da sessão, nunca do browser. */
  clienteId?: string;
  pontos: PontoDorNaTela[];
  registrar: AcaoRegistro;
  excluir?: (formData: FormData) => Promise<EstadoRegistroDor>;
  comoCliente?: boolean;
}) {
  const [selecao, setSelecao] = useState<AncoraSelecionada | null>(null);
  const [intensidade, setIntensidade] = useState(5);
  const [mostrandoCostas, setMostrandoCostas] = useState(false);

  /**
   * O reset acontece DENTRO da action, não num efeito: assim a seleção e o slider só são limpos
   * quando o servidor confirma, e um erro devolve o formulário com o que a pessoa já tinha marcado.
   */
  const [estado, acao, enviando] = useActionState(
    async (anterior: EstadoRegistroDor, formData: FormData) => {
      const resultado = await registrar(anterior, formData);

      if (resultado.status === "sucesso") {
        setSelecao(null);
        setIntensidade(5);
      }

      return resultado;
    },
    estadoInicial,
  );

  const faixa = faixaIntensidade(intensidade);
  const chaveSelecionada = selecao ? `${chaveAncora(selecao)}:${selecao.anterior}` : null;

  /** Estado atual por âncora, pra legenda mostrar a intensidade já registrada. */
  const registradoPorAncora = new Map(
    // `pontos` vem do mais recente pro mais antigo: o primeiro de cada chave é o atual.
    [...pontos].reverse().map((ponto) => [`${chaveAncora(ponto)}:${ponto.anterior}`, ponto]),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-3">
        <div className="relative h-112 overflow-hidden rounded-3xl border border-border bg-creme sm:h-136">
          <Corpo3D
            aoSelecionar={setSelecao}
            mostrandoCostas={mostrandoCostas}
            pontos={pontos}
            selecionada={chaveSelecionada}
          />

          {/*
            Flutua sobre o canvas, centralizado embaixo: é onde o olho já está (o corpo é centrado) e
            sobra espaço, porque a câmera deixa ~15% de folga acima e abaixo do modelo. O wrapper não
            captura ponteiro — só os botões — pra continuar dando pra arrastar e girar por perto.
          */}
          {/* z-30 fica acima dos badges, que o `Html` do drei publica até z-index 20. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
            <div className="pointer-events-auto inline-flex gap-1 rounded-full border border-border/70 bg-surface/85 p-1 shadow-lg backdrop-blur-sm">
              {(
                [
                  [false, "Frente"],
                  [true, "Costas"],
                ] as const
              ).map(([costas, rotulo]) => (
                <button
                  aria-pressed={mostrandoCostas === costas}
                  className={cn(
                    "inline-flex h-9 min-w-24 items-center justify-center rounded-full px-4 text-sm transition",
                    mostrandoCostas === costas
                      ? "bg-brand font-semibold text-brand-foreground shadow-sm"
                      : "font-medium text-muted hover:bg-lilas/20 hover:text-roxo",
                  )}
                  key={rotulo}
                  onClick={() => setMostrandoCostas(costas)}
                  type="button"
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted">
          <MousePointerClick className="size-3.5 shrink-0" aria-hidden="true" />
          Toque num dos pontos numerados para marcar a dor
          {comoCliente ? " que você sente" : " do cliente"} ali — pelo corpo ou pela lista abaixo.
          Arrastar também gira o modelo.
        </p>

        {/* Mesma numeração do modelo: quem não quiser mirar no corpo escolhe aqui. */}
        <ul className="flex flex-wrap gap-1.5">
          {ancorasDaFace(!mostrandoCostas).map((ancora) => {
            const registrado = registradoPorAncora.get(ancora.chave);
            const ativa = chaveSelecionada === ancora.chave;

            return (
              <li key={ancora.chave}>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition",
                    ativa
                      ? "border-roxo bg-roxo text-white"
                      : "border-border bg-surface text-foreground hover:border-roxo/40 hover:bg-lilas/15",
                  )}
                  onClick={() =>
                    setSelecao({
                      regiao: ancora.regiao,
                      lado: ancora.lado,
                      anterior: ancora.anterior,
                      alturaNormalizada: ancora.altura,
                      xNormalizado: ancora.x,
                    })
                  }
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-4 place-items-center rounded-full text-[0.6rem] font-bold",
                      registrado
                        ? "text-white"
                        : ativa
                          ? "bg-white text-roxo"
                          : "bg-lilas text-roxo",
                    )}
                    style={
                      registrado
                        ? { backgroundColor: corCssDaIntensidade(registrado.intensidade) }
                        : undefined
                    }
                  >
                    {registrado ? registrado.intensidade : ancora.numero}
                  </span>
                  {descreverRegiao(ancora.regiao, ancora.lado)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid content-start gap-4">
        {selecao ? (
          <form
            action={acao}
            className="grid gap-3 rounded-3xl border border-border bg-surface p-4"
          >
            {clienteId ? <input name="clienteId" type="hidden" value={clienteId} /> : null}
            <input name="regiao" type="hidden" value={selecao.regiao} />
            <input name="lado" type="hidden" value={selecao.lado ?? ""} />
            <input name="anterior" type="hidden" value={String(selecao.anterior)} />
            <input name="alturaNormalizada" type="hidden" value={selecao.alturaNormalizada} />
            <input name="xNormalizado" type="hidden" value={selecao.xNormalizado} />

            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                {selecao.anterior ? "Frente" : "Costas"}
              </p>
              <h3 className="text-lg font-semibold text-roxo">
                {descreverRegiao(selecao.regiao, selecao.lado)}
              </h3>
            </div>

            <label className="grid gap-2">
              <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                Intensidade da dor
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: corCssDaIntensidade(intensidade) }}
                >
                  {intensidade}
                </span>
              </span>
              <input
                className="w-full accent-roxo"
                max={10}
                min={0}
                name="intensidade"
                onChange={(evento) => setIntensidade(Number(evento.target.value))}
                step={1}
                type="range"
                value={intensidade}
              />
              <span className="flex justify-between text-xs text-muted">
                <span>0 — sem dor</span>
                <span>10 — pior imaginável</span>
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: corCssDaIntensidade(intensidade) }}
              >
                {faixa.rotulo}
              </span>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-foreground">Observação (opcional)</span>
              <textarea
                className="min-h-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                maxLength={1000}
                name="observacao"
                placeholder={comoCliente ? "Piora quando eu…" : "Palpação, irradiação, gatilho…"}
              />
            </label>

            {estado.status === "erro" ? (
              <p className="text-sm font-medium text-perigo">{estado.mensagem}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
                disabled={enviando}
                type="submit"
              >
                {enviando ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Salvar ponto
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted transition hover:bg-creme"
                onClick={() => setSelecao(null)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-4">
            <p className="text-sm text-muted">
              {estado.status === "sucesso" ? (
                <span className="font-medium text-brand">{estado.mensagem}</span>
              ) : (
                "Toque num dos pontos do corpo para registrar a dor."
              )}
            </p>
          </div>
        )}

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold text-roxo">
            Pontos registrados{pontos.length > 0 ? ` (${pontos.length})` : ""}
          </h3>

          {pontos.length === 0 ? (
            <p className="text-sm text-muted">Nenhum ponto de dor registrado ainda.</p>
          ) : (
            <ul className="grid gap-2">
              {pontos.map((ponto) => (
                <li
                  className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3"
                  key={ponto.id}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: corCssDaIntensidade(ponto.intensidade) }}
                  >
                    {ponto.intensidade}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {ponto.descricao}
                      <span className="font-normal text-muted">
                        {" "}
                        · {ponto.anterior ? "frente" : "costas"}
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      {ponto.registradoEm} · {rotulosOrigemRegistroDor[ponto.origem]}
                    </p>
                    {ponto.observacao ? (
                      <p className="mt-1 text-sm text-foreground">{ponto.observacao}</p>
                    ) : null}
                  </div>

                  {excluir && clienteId ? (
                    <BotaoExcluirPonto
                      clienteId={clienteId}
                      descricao={ponto.descricao}
                      excluir={excluir}
                      id={ponto.id}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
