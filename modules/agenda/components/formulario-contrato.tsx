"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, LoaderCircle, Wand2 } from "lucide-react";

import { useFecharModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { agendarContrato, type EstadoFormularioPacote } from "@/modules/pacotes/actions";
import { rotulosSituacaoPagamento, situacoesPagamento } from "@/modules/pacotes/schema";
import { modalidadeAtendimento, rotulosModalidadeAtendimento } from "@/modules/agenda/schema";
import {
  diasDaSemana,
  padraoRepeticao,
  rotulosPadraoRepeticao,
  type PadraoRepeticao,
} from "@/modules/recorrencia/schema";
import { gerarOcorrencias } from "@/modules/recorrencia/gerar";

const estadoInicial: EstadoFormularioPacote = { status: "inicial" };

const classeCampo =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

const OPCOES_FORMA_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência bancária",
  "Boleto",
];

const formatadorDiaSemana = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
});

type Opcao = { id: string; nome: string };

export type ServicoComPlanos = {
  id: string;
  nome: string;
  duracaoMinutos: number;
  valorCentavos: number | null;
  planos: { id: string; nome: string | null; quantidadeSessoes: number; valorCentavos: number }[];
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseLocal(valor: string): Date | null {
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, ano, mes, dia, hora, minuto] = m;
  return new Date(Date.UTC(+ano, +mes - 1, +dia, +hora, +minuto));
}

function formatLocal(data: Date): string {
  return `${data.getUTCFullYear()}-${pad(data.getUTCMonth() + 1)}-${pad(data.getUTCDate())}T${pad(
    data.getUTCHours(),
  )}:${pad(data.getUTCMinutes())}`;
}

/**
 * Agora, no formato de `<input type="datetime-local">`.
 *
 * Passa pela mesma convenção do resto do arquivo: `parseLocal`/`formatLocal` guardam a hora de
 * parede em campos UTC de um `Date`, pra data digitada não deslizar de fuso. Por isso os
 * componentes locais de agora são remontados via `Date.UTC` antes de formatar — usar
 * `toISOString()` direto jogaria a sessão 3h pra trás no Brasil.
 */
function agoraComoValorLocal() {
  const agora = new Date();

  return formatLocal(
    new Date(
      Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        agora.getHours(),
        agora.getMinutes(),
      ),
    ),
  );
}

function reais(valorCentavos: number | null) {
  if (valorCentavos === null) return "";
  return String(valorCentavos / 100).replace(".", ",");
}

function diaSemana(valor: string) {
  const data = parseLocal(valor);
  if (!data) return "Sem data";

  return formatadorDiaSemana.format(data);
}

function Rotulo({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function FormularioContrato({
  clienteFixoId,
  clientes,
  profissionais,
  servicos,
}: {
  clienteFixoId?: string;
  clientes: Opcao[];
  profissionais: Opcao[];
  servicos: ServicoComPlanos[];
}) {
  const [state, formAction, pending] = useActionState(agendarContrato, estadoInicial);
  const router = useRouter();
  const fecharModal = useFecharModal();

  const servicosPorId = useMemo(() => new Map(servicos.map((s) => [s.id, s])), [servicos]);
  // Sessão avulsa quase sempre é marcada pra hoje; deixar em branco obrigava a digitar a data toda.
  const agoraLocal = useMemo(() => agoraComoValorLocal(), []);

  const [servicoId, setServicoId] = useState("");
  const [planoPacoteId, setPlanoPacoteId] = useState("");
  const [valor, setValor] = useState("");
  const [datas, setDatas] = useState<string[]>([agoraComoValorLocal()]);
  const [frequencia, setFrequencia] = useState<PadraoRepeticao>("semanal");
  const [diasSemanaEscolhidos, setDiasSemanaEscolhidos] = useState<number[]>([]);
  const [primeiraData, setPrimeiraData] = useState("");

  const servico = servicoId ? servicosPorId.get(servicoId) : undefined;
  const planos = servico?.planos ?? [];

  useEffect(() => {
    if (state.status === "sucesso") {
      fecharModal();
      router.refresh();
    }
  }, [fecharModal, state, router]);

  function trocarServico(novo: string) {
    setServicoId(novo);
    setPlanoPacoteId("");
    setDatas([agoraLocal]);
    const s = servicosPorId.get(novo);
    setValor(reais(s?.valorCentavos ?? null));
  }

  function trocarPlano(novo: string) {
    setPlanoPacoteId(novo);
    const plano = planos.find((p) => p.id === novo);
    const quantidade = plano ? plano.quantidadeSessoes : 1;
    setDatas((atuais) => {
      const proximos = [...atuais];
      proximos.length = quantidade;

      // Só a primeira ganha "hoje": nas demais, data chutada seria pior que campo vazio.
      return Array.from(proximos, (v, i) => v ?? (i === 0 ? agoraLocal : ""));
    });
    setValor(reais(plano ? plano.valorCentavos : (servico?.valorCentavos ?? null)));
  }

  function alternarDiaSemana(dia: number) {
    setDiasSemanaEscolhidos((atuais) =>
      atuais.includes(dia)
        ? atuais.filter((d) => d !== dia)
        : [...atuais, dia].sort((a, b) => a - b),
    );
  }

  function preencherDatas() {
    const base = parseLocal(primeiraData);
    if (!base) return;

    // Sem nenhum dia marcado, "dias da semana escolhidos" cai no dia da própria primeira sessão.
    const diasSemana = diasSemanaEscolhidos.length > 0 ? diasSemanaEscolhidos : [base.getUTCDay()];

    const geradas = gerarOcorrencias({
      frequencia,
      diaSemana: frequencia === "semanal" ? base.getUTCDay() : null,
      diasSemana,
      diaDoMes: frequencia === "mensal" ? base.getUTCDate() : null,
      hora: base.getUTCHours(),
      minuto: base.getUTCMinutes(),
      dataInicio: new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())),
      quantidade: datas.length,
    }).map(formatLocal);

    setDatas((atuais) => atuais.map((valorAtual, i) => geradas[i] ?? valorAtual));
  }

  function editarData(indice: number, valorNovo: string) {
    setDatas((atuais) => atuais.map((v, i) => (i === indice ? valorNovo : v)));
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-6">
      {clienteFixoId ? <input name="clienteId" type="hidden" value={clienteFixoId} /> : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {clienteFixoId ? null : (
          <div className="grid min-w-0 gap-2">
            <Rotulo htmlFor="clienteId">Cliente</Rotulo>
            <select
              aria-describedby={state?.campos?.clienteId ? "clienteId-erro" : undefined}
              className={classeCampo}
              defaultValue=""
              id="clienteId"
              name="clienteId"
              required
            >
              <option disabled value="">
                Selecione
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {state?.campos?.clienteId?.length ? (
              <p className="text-sm text-perigo" id="clienteId-erro">
                {state.campos.clienteId[0]}
              </p>
            ) : null}
          </div>
        )}

        <div className={cn("grid min-w-0 gap-2", clienteFixoId && "sm:col-span-2")}>
          <Rotulo htmlFor="servicoId">Serviço</Rotulo>
          <select
            className={classeCampo}
            id="servicoId"
            name="servicoId"
            onChange={(e) => trocarServico(e.target.value)}
            required
            value={servicoId}
          >
            <option disabled value="">
              Selecione
            </option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.duracaoMinutos} min)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid min-w-0 gap-2">
        <Rotulo htmlFor="planoPacoteId">Pacote</Rotulo>
        <select
          className={classeCampo}
          disabled={!servico}
          id="planoPacoteId"
          name="planoPacoteId"
          onChange={(e) => trocarPlano(e.target.value)}
          value={planoPacoteId}
        >
          <option value="">Sessão avulsa (1 sessão)</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome ?? `Pacote ${p.quantidadeSessoes} sessões`} — {p.quantidadeSessoes} sessões
            </option>
          ))}
        </select>
        {servico ? (
          <p className="text-xs text-muted">
            {datas.length} {datas.length === 1 ? "sessão" : "sessões"} · duração de cada:{" "}
            {servico.duracaoMinutos} min
          </p>
        ) : (
          <p className="text-xs text-muted">Escolha um serviço para ver os pacotes.</p>
        )}
      </div>

      {/*
        Pré-preenchimento só faz sentido com mais de uma sessão: ele existe pra distribuir N datas por
        uma frequência. Com sessão avulsa o bloco inteiro era ruído — a data já vem como hoje no campo
        abaixo, e a profissional só ajusta se quiser.
      */}
      {datas.length > 1 ? (
        <div className="grid min-w-0 gap-4 rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Pré-preencher datas</p>
            <span className="rounded-full bg-lilas/15 px-3 py-1 text-xs font-semibold text-roxo">
              {datas.length} {datas.length === 1 ? "sessão" : "sessões"}
            </span>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:items-end">
            <div className="grid min-w-0 gap-2">
              <Rotulo htmlFor="primeiraData">Primeira sessão</Rotulo>
              <input
                className={classeCampo}
                id="primeiraData"
                onChange={(e) => setPrimeiraData(e.target.value)}
                type="datetime-local"
                value={primeiraData}
              />
            </div>

            <div className="grid min-w-0 gap-2">
              <Rotulo htmlFor="frequencia">Frequência</Rotulo>
              <select
                className={classeCampo}
                id="frequencia"
                onChange={(e) => setFrequencia(e.target.value as PadraoRepeticao)}
                value={frequencia}
              >
                {padraoRepeticao.map((f) => (
                  <option key={f} value={f}>
                    {rotulosPadraoRepeticao[f]}
                  </option>
                ))}
              </select>
            </div>

            {frequencia === "dias_semana" ? (
              <fieldset className="grid min-w-0 gap-2 sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">
                  Dias da semana do atendimento
                </legend>
                <div className="flex min-w-0 flex-wrap gap-2">
                  {diasDaSemana.map((dia) => {
                    const marcado = diasSemanaEscolhidos.includes(dia.valor);

                    return (
                      <button
                        aria-pressed={marcado}
                        className={cn(
                          "h-9 rounded-full border px-4 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo",
                          marcado
                            ? "border-roxo bg-lilas/25 text-roxo"
                            : "border-border bg-surface text-muted hover:bg-creme hover:text-roxo",
                        )}
                        key={dia.valor}
                        onClick={() => alternarDiaSemana(dia.valor)}
                        title={dia.rotulo}
                        type="button"
                      >
                        {dia.abreviacao}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted">
                  Ex.: seg, qua e sex às 14h30 — as datas se repetem semana a semana até completar
                  as sessões. Sem nenhum dia marcado, usa o dia da primeira sessão.
                </p>
              </fieldset>
            ) : null}

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme hover:text-roxo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:w-auto sm:justify-self-end"
              disabled={!primeiraData}
              onClick={preencherDatas}
              type="button"
            >
              <Wand2 className="size-4" aria-hidden="true" />
              Preencher
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            {datas.length > 1 ? "Datas das sessões" : "Data da sessão"}
          </p>
          <span className="text-xs font-medium text-muted">
            {datas.length} {datas.length === 1 ? "data" : "datas"}
          </span>
        </div>

        <ul className="grid min-w-0 gap-2">
          {datas.map((valorData, indice) => {
            const dia = diaSemana(valorData);

            return (
              <li
                className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-[2rem_8.5rem_minmax(0,1fr)] sm:gap-3"
                key={indice}
              >
                <span className="text-sm font-semibold text-muted">{indice + 1}.</span>
                <span
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center justify-center rounded-full px-3 text-xs font-semibold",
                    valorData ? "bg-lilas/15 text-roxo" : "bg-background text-muted",
                  )}
                >
                  <span className="truncate">{dia}</span>
                </span>
                <input
                  aria-label={`Data da sessão ${indice + 1}`}
                  className={cn(classeCampo, "col-span-2 sm:col-span-1")}
                  name="dataHora"
                  onChange={(e) => editarData(indice, e.target.value)}
                  required
                  type="datetime-local"
                  value={valorData}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="profissionalId">Profissional</Rotulo>
          <select
            aria-describedby={state?.campos?.profissionalId ? "profissionalId-erro" : undefined}
            className={classeCampo}
            defaultValue=""
            id="profissionalId"
            name="profissionalId"
            required
          >
            <option disabled value="">
              Selecione
            </option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {state?.campos?.profissionalId?.length ? (
            <p className="text-sm text-perigo" id="profissionalId-erro">
              {state.campos.profissionalId[0]}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="modalidade">Modalidade</Rotulo>
          <select
            className={classeCampo}
            defaultValue="presencial"
            id="modalidade"
            name="modalidade"
          >
            {modalidadeAtendimento.map((m) => (
              <option key={m} value={m}>
                {rotulosModalidadeAtendimento[m]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="valor">Valor total (R$)</Rotulo>
          <input
            className={classeCampo}
            id="valor"
            inputMode="decimal"
            name="valor"
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ex.: 990,00"
            value={valor}
          />
        </div>

        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="formaPagamento">Forma de pagamento</Rotulo>
          <select className={classeCampo} defaultValue="" id="formaPagamento" name="formaPagamento">
            <option value="">Selecione</option>
            {OPCOES_FORMA_PAGAMENTO.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="situacaoPagamento">Situação do pagamento</Rotulo>
          <select
            className={classeCampo}
            defaultValue="pendente"
            id="situacaoPagamento"
            name="situacaoPagamento"
          >
            {situacoesPagamento.map((s) => (
              <option key={s} value={s}>
                {rotulosSituacaoPagamento[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 gap-2">
          <Rotulo htmlFor="observacoes">Observações</Rotulo>
          <input
            className={classeCampo}
            id="observacoes"
            name="observacoes"
            placeholder="Aplicadas a todas as sessões"
          />
        </div>
      </div>

      {state?.mensagem ? (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium",
            state.status === "erro" ? "bg-perigo/10 text-perigo" : "bg-brand/10 text-brand",
          )}
          role={state.status === "erro" ? "alert" : "status"}
        >
          {state.mensagem}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending || !servico}
          type="submit"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CalendarRange className="size-4" />
          )}
          Criar agendamento
        </button>
      </div>
    </form>
  );
}
