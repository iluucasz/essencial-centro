import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  FileText,
  HeartPulse,
  ImagePlus,
  LayoutTemplate,
  Mail,
  MapPin,
  NotebookPen,
  PackageCheck,
  Phone,
  Pill,
  Ruler,
  ShieldCheck,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { agoraBrasilia, cn } from "@/lib/utils";
import { FormularioAgendamento } from "@/modules/agenda/components/formulario-agendamento";
import { listarAgendamentosDoCliente } from "@/modules/agenda/queries";
import { exigirUsuarioAtual, listarProfissionaisAtivos } from "@/modules/auth/queries";
import { desativarBiometria } from "@/modules/biometria/actions";
import { listarBiometriasDoCliente } from "@/modules/biometria/queries";
import { podeExcluirClientes } from "@/modules/clientes/acesso";
import { registrarConsentimentoBiometria } from "@/modules/clientes/actions";
import { AbasPerfilCliente } from "@/modules/clientes/components/abas-perfil-cliente";
import {
  ListaAgendamentosCliente,
  type AgendamentoClienteLista,
} from "@/modules/clientes/components/lista-agendamentos-cliente";
import { MenuAcoesCliente } from "@/modules/clientes/components/menu-acoes-cliente";
import { getCliente } from "@/modules/clientes/queries";
import type { Cliente } from "@/modules/clientes/schema";
import { FormularioDocumento } from "@/modules/documentos/components/formulario-documento";
import { listarDocumentosDoCliente } from "@/modules/documentos/queries";
import {
  ListaFichas,
  type FichaLista,
  type ModeloResumo,
} from "@/modules/fichas/components/lista-fichas";
import { SeletorModeloFicha } from "@/modules/fichas/components/seletor-modelo-ficha";
import { listarFichasDoCliente } from "@/modules/fichas/queries";
import { listarModelosFicha } from "@/modules/fichas/modelos-queries";
import { FormularioFoto } from "@/modules/fotos/components/formulario-foto";
import { GaleriaFotos } from "@/modules/fotos/components/galeria-fotos";
import { MenuFotoCliente } from "@/modules/fotos/components/menu-foto-cliente";
import { obterFotoPerfilCliente } from "@/modules/fotos/perfil-queries";
import { listarFotosDoCliente } from "@/modules/fotos/queries";
import {
  HistoricoMedidas as HistoricoMedidasGerenciavel,
  type MedidaLista,
} from "@/modules/medidas/components/historico-medidas";
import { FormularioMedida } from "@/modules/medidas/components/formulario-medida";
import {
  listarEvolucaoDoCliente,
  listarMedidasDoCliente,
  type EvolucaoAgrupada,
} from "@/modules/medidas/queries";
import {
  rotulosLadoMedida,
  rotulosRegiaoMedida,
  type LadoMedida,
  type RegiaoMedida,
} from "@/modules/medidas/schema";
import { FormularioMedicamento } from "@/modules/medicamentos/components/formulario-medicamento";
import {
  ListaMedicamentos as ListaMedicamentosGerenciavel,
  type MedicamentoLista,
} from "@/modules/medicamentos/components/lista-medicamentos";
import { listarMedicamentosDoCliente } from "@/modules/medicamentos/queries";
import { DestaquePacoteCliente } from "@/modules/pacotes/components/destaque-pacote-cliente";
import { montarPacotesEmDestaque } from "@/modules/pacotes/destaque";
import { listarPacotesDoCliente } from "@/modules/pacotes/queries";
import { rotulosSituacaoPagamento, type SituacaoPagamento } from "@/modules/pacotes/schema";
import { listarServicos } from "@/modules/servicos/queries";
import {
  FormularioSessao,
  type AgendamentoSessaoFormulario,
} from "@/modules/sessoes/components/formulario-sessao";
import {
  ListaSessoes as ListaSessoesGerenciavel,
  type SessaoLista,
} from "@/modules/sessoes/components/lista-sessoes";
import { AvisoPendenciasRegistroSessaoCliente } from "@/modules/sessoes/components/aviso-pendencias-registro-sessao";
import { listarSessoesDoCliente } from "@/modules/sessoes/queries";
import { filtrarAgendamentosRealizadosSemSessao } from "@/modules/sessoes/pendencias";
import { rotulosStatusDocumento, rotulosTipoDocumento } from "@/modules/documentos/schema";
import { rotulosDedoBiometria, type DedoBiometria } from "@/modules/biometria/schema";
import type { StatusDocumento, TipoDocumento } from "@/modules/documentos/schema";
import type { ProgressoPacote } from "@/modules/pacotes/progresso";

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "UTC",
});
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
});

type ValorInfo = Date | string | boolean | null | undefined;
type AbaCliente =
  | "resumo"
  | "fichas"
  | "agendamentos"
  | "sessoes"
  | "medidas"
  | "pacotes"
  | "documentos"
  | "fotos"
  | "medicamentos"
  | "biometria";

type TomPerfil = "brand" | "dourado" | "neutro" | "perigo" | "roxo" | "salvia";

const estilosTomPerfil: Record<
  TomPerfil,
  {
    cabecalho: string;
    card: string;
    faixa: string;
    icone: string;
    painel: string;
  }
> = {
  brand: {
    cabecalho: "border-brand/10 bg-surface/85",
    card: "border-brand/15 bg-surface",
    faixa: "bg-brand",
    icone: "bg-brand/10 text-brand",
    painel: "border-brand/10 bg-brand/5",
  },
  dourado: {
    cabecalho: "border-dourado/15 bg-surface/85",
    card: "border-dourado/20 bg-surface",
    faixa: "bg-dourado",
    icone: "bg-dourado/15 text-dourado",
    painel: "border-dourado/15 bg-dourado/10",
  },
  neutro: {
    cabecalho: "border-border bg-surface/85",
    card: "border-border bg-surface",
    faixa: "bg-muted",
    icone: "bg-creme text-muted",
    painel: "border-border bg-creme/70",
  },
  perigo: {
    cabecalho: "border-perigo/10 bg-surface/85",
    card: "border-perigo/15 bg-surface",
    faixa: "bg-perigo",
    icone: "bg-perigo/10 text-perigo",
    painel: "border-perigo/10 bg-perigo/5",
  },
  roxo: {
    cabecalho: "border-roxo/10 bg-surface/85",
    card: "border-roxo/15 bg-surface",
    faixa: "bg-roxo",
    icone: "bg-lilas/25 text-roxo",
    painel: "border-roxo/10 bg-lilas/20",
  },
  salvia: {
    cabecalho: "border-salvia/15 bg-surface/85",
    card: "border-salvia/20 bg-surface",
    faixa: "bg-salvia",
    icone: "bg-salvia/15 text-brand",
    painel: "border-salvia/15 bg-salvia/10",
  },
};

function normalizarAbaCliente(valor: string | undefined, permitidas: readonly AbaCliente[]) {
  return permitidas.includes(valor as AbaCliente) ? (valor as AbaCliente) : "resumo";
}

function formatarTexto(valor: ValorInfo) {
  if (valor === null || valor === undefined || valor === "") return "Não informado";

  if (valor instanceof Date) return formatadorData.format(valor);
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";

  return valor;
}

function formatarIdade(dataNascimento: Date) {
  const hoje = agoraBrasilia();
  let idade = hoje.getUTCFullYear() - dataNascimento.getUTCFullYear();
  const aindaNaoFezAniversario =
    hoje.getUTCMonth() < dataNascimento.getUTCMonth() ||
    (hoje.getUTCMonth() === dataNascimento.getUTCMonth() &&
      hoje.getUTCDate() < dataNascimento.getUTCDate());

  if (aindaNaoFezAniversario) idade -= 1;

  return `${idade} anos`;
}

function getIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "CL";
}

function ehClienteGestao(cliente: Awaited<ReturnType<typeof getCliente>>): cliente is Cliente {
  return Boolean(cliente && "observacoesInternas" in cliente);
}

function formatarCm(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;
}

function formatarMedicamentoResumo(medicamento: MedicamentoLista) {
  return [medicamento.nome, medicamento.dosagem, medicamento.frequencia]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(" · ");
}

function formatarMedicamentosEmUso(
  medicamentos: MedicamentoLista[],
  fallback: string | null | undefined,
) {
  const registros = medicamentos.map(formatarMedicamentoResumo).filter(Boolean);

  if (registros.length > 0) return registros.join("\n");

  return fallback?.trim() || null;
}

function BreadcrumbCliente({ nome }: { nome: string }) {
  return (
    <nav aria-label="Caminho da página" className="flex flex-wrap items-center gap-2 text-sm">
      <Link className="font-medium text-muted transition hover:text-brand" href="/painel">
        Painel
      </Link>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
      <Link className="font-medium text-muted transition hover:text-brand" href="/painel/clientes">
        Clientes
      </Link>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
      <span className="font-semibold text-brand" aria-current="page">
        {nome}
      </span>
    </nav>
  );
}

function ContatoItem({
  icone,
  tom = "roxo",
  texto,
}: {
  icone: React.ReactNode;
  tom?: TomPerfil;
  texto: string | null | undefined;
}) {
  const estilo = estilosTomPerfil[tom];

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-2xl border bg-surface/85 px-3 py-2 text-sm text-muted",
        estilo.card,
      )}
    >
      <span className={cn("shrink-0 rounded-lg p-1.5", estilo.icone)}>{icone}</span>
      <span className="truncate">{texto?.trim() || "Não informado"}</span>
    </span>
  );
}

function MetricaPerfil({
  icone,
  label,
  tom = "brand",
  valor,
}: {
  icone: React.ReactNode;
  label: string;
  tom?: TomPerfil;
  valor: number | string;
}) {
  const estilo = estilosTomPerfil[tom];

  return (
    <div className="border-t border-brand/10 p-4 md:border-t-0 md:border-l first:md:border-l-0">
      <div className="mx-auto flex w-fit items-center justify-center gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-2xl", estilo.icone)}>
          {icone}
        </span>
        <div className="grid min-w-24 justify-items-center text-center">
          <dd className="text-2xl leading-none font-semibold text-brand">{valor}</dd>
          <dt className="mt-1 text-xs font-medium text-muted">{label}</dt>
        </div>
      </div>
    </div>
  );
}

function CardResumo({
  icone,
  tom = "brand",
  titulo,
  valor,
}: {
  icone: React.ReactNode;
  tom?: TomPerfil;
  titulo: string;
  valor: ValorInfo;
}) {
  const estilo = estilosTomPerfil[tom];

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border p-5", estilo.card)}>
      <span className={cn("absolute inset-y-0 left-0 w-1", estilo.faixa)} aria-hidden="true" />
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className={cn("rounded-xl p-2", estilo.icone)}>{icone}</span>
        {titulo}
      </div>
      <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-foreground">
        {formatarTexto(valor)}
      </p>
    </article>
  );
}

function CabecalhoSecao({
  acao,
  descricao,
  icone,
  tom = "brand",
  titulo,
}: {
  acao?: React.ReactNode;
  descricao?: string;
  icone: React.ReactNode;
  tom?: TomPerfil;
  titulo: string;
}) {
  const estilo = estilosTomPerfil[tom];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-surface/95 p-4 shadow-sm sm:p-5",
        estilo.cabecalho,
      )}
    >
      <span
        className={cn("absolute inset-y-5 left-0 w-1 rounded-r-full", estilo.faixa)}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-between gap-4 pl-1">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              estilo.icone,
            )}
          >
            {icone}
          </span>
          <span className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
            {descricao ? <p className="mt-1 text-sm text-muted">{descricao}</p> : null}
          </span>
        </div>
        {acao}
      </div>
    </div>
  );
}

function SecaoPerfil({
  acao,
  children,
  descricao,
  icone,
  id,
  tom = "brand",
  titulo,
}: {
  acao?: React.ReactNode;
  children: React.ReactNode;
  descricao?: string;
  icone: React.ReactNode;
  id: string;
  tom?: TomPerfil;
  titulo: string;
}) {
  const estilo = estilosTomPerfil[tom];

  return (
    <section
      className={cn("grid scroll-mt-24 gap-5 rounded-3xl border p-4 sm:p-6", estilo.painel)}
      id={id}
    >
      <CabecalhoSecao acao={acao} descricao={descricao} icone={icone} titulo={titulo} tom={tom} />
      {children}
    </section>
  );
}

function PainelVazio({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/90 p-6 text-sm text-muted">
      <span className="bg-menta rounded-2xl p-3 text-brand">{icone}</span>
      {texto}
    </div>
  );
}

function rotuloMedida(regiao: RegiaoMedida, lado: LadoMedida | null) {
  return lado
    ? `${rotulosRegiaoMedida[regiao]} (${rotulosLadoMedida[lado]})`
    : rotulosRegiaoMedida[regiao];
}

function chaveMedida(regiao: RegiaoMedida, lado: LadoMedida | null) {
  return `${regiao}:${lado ?? ""}`;
}

type MedidaPerfil = {
  id: string;
  regiao: RegiaoMedida;
  lado: LadoMedida | null;
  valorCm: number;
  dataMedicao: Date;
};

function selecionarSeries(medidas: MedidaPerfil[]) {
  const porGrupo = new Map<string, MedidaPerfil[]>();

  for (const medida of medidas) {
    const chave = chaveMedida(medida.regiao, medida.lado);
    const lista = porGrupo.get(chave) ?? [];
    lista.push(medida);
    porGrupo.set(chave, lista);
  }

  return [...porGrupo.values()]
    .map((itens) => itens.sort((a, b) => a.dataMedicao.getTime() - b.dataMedicao.getTime()))
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);
}

function GraficoMedidas({ medidas }: { medidas: MedidaPerfil[] }) {
  const series = selecionarSeries(medidas);

  if (series.length === 0) return null;

  const datas = [
    ...new Set(
      series.flatMap((serie) =>
        serie.map((medida) => medida.dataMedicao.toISOString().slice(0, 10)),
      ),
    ),
  ].sort();
  const valores = series.flatMap((serie) => serie.map((medida) => medida.valorCm));
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const intervalo = Math.max(maximo - minimo, 1);
  const cores = [
    "var(--color-brand)",
    "var(--color-roxo)",
    "var(--color-dourado)",
    "var(--color-muted)",
  ];
  const largura = 720;
  const altura = 260;
  const margem = { baixo: 40, cima: 24, direita: 24, esquerda: 48 };
  const larguraPlot = largura - margem.esquerda - margem.direita;
  const alturaPlot = altura - margem.cima - margem.baixo;
  const xPorData = new Map(
    datas.map((data, indice) => [
      data,
      margem.esquerda +
        (datas.length === 1 ? larguraPlot / 2 : (indice / (datas.length - 1)) * larguraPlot),
    ]),
  );
  const y = (valor: number) => margem.cima + ((maximo - valor) / intervalo) * alturaPlot;

  return (
    <article className="min-w-0 rounded-3xl border border-border bg-surface p-4 sm:p-6">
      <h3 className="text-base font-semibold text-foreground">Evolução das medidas (cm)</h3>
      <div className="mt-4 overflow-hidden">
        <svg
          aria-label="Gráfico de evolução das medidas"
          className="h-auto w-full min-w-0"
          viewBox={`0 0 ${largura} ${altura}`}
        >
          {[0, 1, 2, 3].map((linha) => {
            const yLinha = margem.cima + (linha / 3) * alturaPlot;

            return (
              <line
                key={linha}
                stroke="var(--color-border)"
                strokeDasharray="4 6"
                x1={margem.esquerda}
                x2={largura - margem.direita}
                y1={yLinha}
                y2={yLinha}
              />
            );
          })}
          {datas.map((data) => {
            const x = xPorData.get(data)!;

            return (
              <g key={data}>
                <line
                  stroke="var(--color-border)"
                  strokeDasharray="4 6"
                  x1={x}
                  x2={x}
                  y1={margem.cima}
                  y2={margem.cima + alturaPlot}
                />
                <text
                  fill="var(--color-muted)"
                  fontSize="12"
                  textAnchor="middle"
                  x={x}
                  y={altura - 12}
                >
                  {formatadorDataCurta.format(new Date(`${data}T00:00:00.000Z`))}
                </text>
              </g>
            );
          })}
          {series.map((serie, indice) => {
            const pontos = serie
              .map((medida) => {
                const x = xPorData.get(medida.dataMedicao.toISOString().slice(0, 10))!;

                return `${x},${y(medida.valorCm)}`;
              })
              .join(" ");
            const cor = cores[indice % cores.length];

            return (
              <g key={chaveMedida(serie[0].regiao, serie[0].lado)}>
                <polyline
                  fill="none"
                  points={pontos}
                  stroke={cor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                {serie.map((medida) => {
                  const x = xPorData.get(medida.dataMedicao.toISOString().slice(0, 10))!;

                  return <circle cx={x} cy={y(medida.valorCm)} fill={cor} key={medida.id} r="4" />;
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted">
        {series.map((serie, indice) => (
          <span
            className="inline-flex items-center gap-2"
            key={chaveMedida(serie[0].regiao, serie[0].lado)}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: cores[indice % cores.length] }}
            />
            {rotuloMedida(serie[0].regiao, serie[0].lado)}
          </span>
        ))}
      </div>
    </article>
  );
}

function CardsEvolucao({ evolucao }: { evolucao: EvolucaoAgrupada[] }) {
  const destaques = evolucao
    .filter((item) => item.diferencaCm !== 0)
    .sort((a, b) => Math.abs(b.diferencaCm) - Math.abs(a.diferencaCm))
    .slice(0, 4);

  if (destaques.length === 0) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
      {destaques.map((item) => (
        <article
          className="rounded-3xl border border-border bg-surface p-5 text-center"
          key={chaveMedida(item.regiao, item.lado)}
        >
          <p className="text-sm text-muted">{rotuloMedida(item.regiao, item.lado)}</p>
          <p className="mt-3 text-2xl font-semibold text-brand">
            {item.reducao ? "↘ " : "↗ "}
            {item.reducao ? "-" : "+"}
            {formatarCm(Math.abs(item.diferencaCm))}
          </p>
          <p className="mt-2 text-sm text-muted">
            {formatarCm(item.inicial)} → {formatarCm(item.atual)}
          </p>
        </article>
      ))}
    </div>
  );
}

const classePagamento: Record<SituacaoPagamento, string> = {
  pendente: "bg-dourado/20 text-dourado",
  parcial: "bg-lilas/25 text-roxo",
  pago: "bg-brand/15 text-brand",
};

function formatarMoeda(valorCentavos: number | null) {
  if (valorCentavos === null) return "Valor a definir";

  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(
    valorCentavos / 100,
  );
}

function ListaPacotesPerfil({
  pacotes,
}: {
  pacotes: {
    id: string;
    servicoNome: string;
    quantidadeSessoes: number;
    valorCentavos: number | null;
    situacaoPagamento: SituacaoPagamento;
    ativo: boolean;
    progresso: ProgressoPacote;
  }[];
}) {
  if (pacotes.length === 0) {
    return (
      <PainelVazio
        icone={<PackageCheck className="size-4" />}
        texto="Nenhum contrato cadastrado."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {pacotes.map((pacote) => (
        <article className="rounded-3xl border border-border bg-surface p-6" key={pacote.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{pacote.servicoNome}</h3>
              <p className="mt-1 text-sm text-muted">
                {pacote.quantidadeSessoes} sessões{pacote.ativo ? "" : " · inativo"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${classePagamento[pacote.situacaoPagamento]}`}
            >
              {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-foreground">
              <span>
                {pacote.progresso.sessoesRealizadas} de {pacote.progresso.quantidadeSessoes} sessões
                realizadas
              </span>
              <strong className="text-brand">{pacote.progresso.percentualConcluido}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-creme">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${pacote.progresso.percentualConcluido}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {pacote.progresso.sessoesRestantes} sessões restantes
            </p>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-border pt-5 md:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted">Valor total</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatarMoeda(pacote.valorCentavos)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Pagamento</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {rotulosSituacaoPagamento[pacote.situacaoPagamento]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Sessões restantes</dt>
              <dd className="mt-1 font-semibold text-brand">{pacote.progresso.sessoesRestantes}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

const classeDocumento: Record<StatusDocumento, string> = {
  assinado: "text-brand",
  emitido: "text-dourado",
};

function ListaDocumentosPerfil({
  clienteId,
  documentos,
}: {
  clienteId: string;
  documentos: {
    id: string;
    tipo: TipoDocumento;
    titulo: string;
    status: StatusDocumento;
    criadoEm: Date;
  }[];
}) {
  if (documentos.length === 0) {
    return (
      <PainelVazio icone={<FileText className="size-4" />} texto="Nenhum documento emitido." />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <ul className="divide-y divide-border">
        {documentos.map((documento) => (
          <li key={documento.id}>
            <Link
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-creme"
              href={`/painel/clientes/${clienteId}/documentos/${documento.id}`}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="bg-menta flex size-12 shrink-0 items-center justify-center rounded-2xl text-brand">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {documento.titulo}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {rotulosTipoDocumento[documento.tipo]} ·{" "}
                    {formatadorDataCurta.format(documento.criadoEm)}
                  </span>
                </span>
              </span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${classeDocumento[documento.status]}`}
              >
                {documento.status === "assinado" ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <TriangleAlert className="size-4" aria-hidden="true" />
                )}
                {rotulosStatusDocumento[documento.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaBiometriasPerfil({
  clienteId,
  biometrias,
}: {
  clienteId: string;
  biometrias: {
    id: string;
    dedo: DedoBiometria;
    qualidadeCaptura: number;
    criadoEm: Date;
  }[];
}) {
  if (biometrias.length === 0) {
    return (
      <PainelVazio icone={<Fingerprint className="size-4" />} texto="Nenhuma digital cadastrada." />
    );
  }

  return (
    <div className="grid gap-4">
      {biometrias.map((biometria) => (
        <article
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-5"
          key={biometria.id}
        >
          <span className="flex items-center gap-4">
            <span className="bg-menta flex size-12 items-center justify-center rounded-2xl text-brand">
              <Fingerprint className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold text-foreground">
                {rotulosDedoBiometria[biometria.dedo]}
              </span>
              <span className="mt-1 block text-sm text-muted">
                Qualidade {biometria.qualidadeCaptura} · cadastrada em{" "}
                {formatadorDataHora.format(biometria.criadoEm)}
              </span>
            </span>
          </span>

          <form action={desativarBiometria}>
            <input name="id" type="hidden" value={biometria.id} />
            <input name="clienteId" type="hidden" value={clienteId} />
            <button
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-creme"
              type="submit"
            >
              Desativar
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}

export default async function ClienteDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; novoAtendimento?: string }>;
}) {
  const [{ id }, { aba, novoAtendimento }] = await Promise.all([params, searchParams]);
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const profissional = usuario.role === "profissional";
  const [cliente, fotoPerfil, fichas, biometrias, pacotes] = await Promise.all([
    getCliente(id),
    obterFotoPerfilCliente(id),
    listarFichasDoCliente(id),
    listarBiometriasDoCliente(id),
    listarPacotesDoCliente(id),
  ]);

  if (!ehClienteGestao(cliente)) {
    notFound();
  }

  const dadosSessoes = profissional
    ? await Promise.all([
        listarSessoesDoCliente(id),
        listarServicos(),
        listarAgendamentosDoCliente(id),
        listarProfissionaisAtivos(),
      ])
    : null;

  const dadosMedidas = profissional
    ? await Promise.all([listarEvolucaoDoCliente(id), listarMedidasDoCliente(id)])
    : null;
  const evolucaoMedidas = dadosMedidas?.[0] ?? null;
  const medidasBrutas = dadosMedidas?.[1] ?? null;

  const fotos = profissional ? await listarFotosDoCliente(id) : null;

  const documentos = profissional ? await listarDocumentosDoCliente(id) : null;

  const medicamentos = profissional ? await listarMedicamentosDoCliente(id) : null;

  const modelosFicha = profissional ? await listarModelosFicha() : [];

  const observacoesInternas =
    typeof cliente.observacoesInternas === "string" ? cliente.observacoesInternas : null;

  const sessoesParaSelecao = dadosSessoes
    ? dadosSessoes[0].map((s) => ({
        id: s.id,
        nome: `${formatadorDataCurta.format(s.dataHora)} · ${s.regiaoTratada ?? "Sessão"}`,
      }))
    : [];

  const servicosParaSessoes = dadosSessoes
    ? dadosSessoes[1].map((s) => ({ id: s.id, nome: s.nome }))
    : [];
  const pacotesDoClienteParaSelecao = pacotes.map((p) => ({
    ativo: p.ativo,
    id: p.id,
    nome: `${p.servicoNome} · ${p.quantidadeSessoes} sessões · ${formatadorDataCurta.format(p.dataContratacao)}${p.ativo ? "" : " · inativo"}`,
  }));
  const nomePacotePorId = new Map(pacotesDoClienteParaSelecao.map((p) => [p.id, p.nome]));
  const agendamentosParaSessoes: AgendamentoSessaoFormulario[] = dadosSessoes
    ? dadosSessoes[2].map((a) => ({
        duracaoMinutos: a.duracaoMinutos,
        id: a.id,
        inicio: a.inicio,
        nome: `${formatadorDataHora.format(a.inicio)} · ${a.servicoNome}`,
        pacoteId: a.pacoteId,
        pacoteNome: a.pacoteId ? (nomePacotePorId.get(a.pacoteId) ?? "Pacote vinculado") : null,
        servicoId: a.servicoId,
        servicoNome: a.servicoNome,
        status: a.status,
      }))
    : [];
  const pacotesParaSessoes = pacotesDoClienteParaSelecao.map((p) => ({ id: p.id, nome: p.nome }));
  const pacotesAtivosDoClienteParaSelecao = pacotesDoClienteParaSelecao
    .filter((p) => p.ativo)
    .map((p) => ({ id: p.id, nome: p.nome }));
  const todosPacotesDoClienteParaSelecao = pacotesDoClienteParaSelecao.map((p) => ({
    id: p.id,
    nome: p.nome,
  }));
  const sessoesParaLista: SessaoLista[] = dadosSessoes ? dadosSessoes[0] : [];
  const agendamentosPendentesSessao = filtrarAgendamentosRealizadosSemSessao(
    agendamentosParaSessoes,
    sessoesParaLista,
  );
  const agendamentosParaPerfil: AgendamentoClienteLista[] = dadosSessoes ? dadosSessoes[2] : [];
  const medidasParaLista: MedidaLista[] = medidasBrutas ?? [];
  const medicamentosParaLista: MedicamentoLista[] = medicamentos ?? [];
  const medicamentosEmUso = formatarMedicamentosEmUso(medicamentosParaLista, cliente.medicamentos);
  const servicosParaFichas = servicosParaSessoes;

  const fichasParaLista: FichaLista[] = fichas.map((item) => ({
    id: item.id,
    aceiteTermosEm: item.aceiteTermosEm,
    atualizadoEm: item.atualizadoEm,
    autorizacaoImagemEm: item.autorizacaoImagemEm,
    clienteId: item.clienteId,
    criadoEm: item.criadoEm,
    modeloFichaId: item.modeloFichaId,
    respostas: profissional ? item.respostas : null,
    servicoId: item.servicoId,
    status: item.status,
    tipo: item.tipo,
    versao: item.versao,
  }));

  const modelosResumo: ModeloResumo[] = modelosFicha.map((modelo) => ({
    id: modelo.id,
    nome: modelo.nome,
    campos: modelo.campos,
  }));
  const modelosParaSeletor = modelosFicha
    .filter((modelo) => modelo.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((modelo) => ({
      id: modelo.id,
      nome: modelo.nome,
      descricao: modelo.descricao,
      campos: modelo.campos,
    }));

  const pacotesAtivos = pacotes.filter((pacote) => pacote.ativo).length;
  const podeExcluirCliente = podeExcluirClientes(usuario);
  const statusCliente = pacotesAtivos > 0 ? "Ativa" : "Cadastro";
  const pacotesEmDestaque = montarPacotesEmDestaque(
    pacotes,
    dadosSessoes?.[2] ?? [],
    agoraBrasilia(),
  );
  const reducaoAcumulada =
    evolucaoMedidas?.reduce(
      (total, item) => total + (item.reducao ? Math.abs(item.diferencaCm) : 0),
      0,
    ) ?? 0;
  const abasDisponiveis: Array<{ id: AbaCliente; rotulo: string; contador?: number }> = [
    { id: "resumo", rotulo: "Resumo" },
    { id: "fichas", rotulo: "Fichas", contador: fichas.length },
    ...(profissional
      ? [
          {
            id: "agendamentos" as const,
            rotulo: "Agendamentos",
            contador: dadosSessoes?.[2].length ?? 0,
          },
          { id: "sessoes" as const, rotulo: "Sessões", contador: dadosSessoes?.[0].length ?? 0 },
          { id: "medidas" as const, rotulo: "Medidas", contador: evolucaoMedidas?.length ?? 0 },
        ]
      : []),
    { id: "pacotes", rotulo: "Pacotes", contador: pacotes.length },
    ...(profissional
      ? [
          { id: "documentos" as const, rotulo: "Documentos", contador: documentos?.length ?? 0 },
          { id: "fotos" as const, rotulo: "Fotos", contador: fotos?.length ?? 0 },
          {
            id: "medicamentos" as const,
            rotulo: "Medicamentos",
            contador: medicamentos?.length ?? 0,
          },
        ]
      : []),
    { id: "biometria", rotulo: "Biometria", contador: biometrias.length },
  ];
  const abaAtual = normalizarAbaCliente(
    aba,
    abasDisponiveis.map((item) => item.id),
  );
  const hrefAba = (abaDestino: AbaCliente) =>
    abaDestino === "resumo" ? `/painel/clientes/${id}` : `/painel/clientes/${id}?aba=${abaDestino}`;
  const abasPerfil = abasDisponiveis.map((item) => ({ ...item, href: hrefAba(item.id) }));

  return (
    <div className="grid min-w-0 gap-6 sm:gap-7">
      <BreadcrumbCliente nome={cliente.nome} />

      <section className="overflow-hidden rounded-3xl border border-roxo/10 bg-lilas/10 shadow-sm">
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch">
          <div className="flex min-w-0 flex-col gap-5 rounded-3xl border border-roxo/10 bg-surface/90 p-4 shadow-sm sm:p-5 md:flex-row md:items-center">
            <div className="relative size-24 shrink-0">
              {fotoPerfil ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                  <img
                    alt={`Foto de ${cliente.nome}`}
                    className="size-24 rounded-full border-4 border-surface object-cover shadow-sm"
                    src={`/api/clientes/${id}/foto-perfil`}
                  />
                </>
              ) : (
                <span className="flex size-24 items-center justify-center rounded-full border-4 border-surface bg-brand text-2xl font-semibold text-brand-foreground shadow-sm">
                  {getIniciais(cliente.nome)}
                </span>
              )}
              <MenuFotoCliente
                clienteId={id}
                clienteNome={cliente.nome}
                temFoto={Boolean(fotoPerfil)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex min-w-0 flex-wrap items-center gap-3">
                  <h1 className="min-w-0 text-3xl font-semibold text-foreground">{cliente.nome}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                    {statusCliente}
                  </span>
                </span>
                <MenuAcoesCliente
                  cliente={cliente}
                  medicamentosEmUso={medicamentosEmUso}
                  podeExcluir={podeExcluirCliente}
                />
              </div>
              <p className="mt-2 inline-flex rounded-full bg-lilas/15 px-3 py-1 text-sm font-medium text-roxo">
                {[cliente.profissao, formatarIdade(cliente.dataNascimento)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <ContatoItem
                  icone={<Phone className="size-4" />}
                  texto={cliente.telefone}
                  tom="brand"
                />
                <ContatoItem icone={<Mail className="size-4" />} texto={cliente.email} tom="roxo" />
                <ContatoItem
                  icone={<MapPin className="size-4" />}
                  texto={cliente.endereco}
                  tom="dourado"
                />
              </div>
            </div>
          </div>

          <DestaquePacoteCliente pacotes={pacotesEmDestaque} />
        </div>

        <dl className="grid border-t border-roxo/10 bg-surface/80 md:grid-cols-4">
          <MetricaPerfil
            icone={<NotebookPen className="size-4" aria-hidden="true" />}
            label="Sessões realizadas"
            valor={dadosSessoes?.[0].length ?? "—"}
          />
          <MetricaPerfil
            icone={<PackageCheck className="size-4" aria-hidden="true" />}
            label="Pacotes ativos"
            tom="dourado"
            valor={pacotesAtivos}
          />
          <MetricaPerfil
            icone={<FileText className="size-4" aria-hidden="true" />}
            label="Fichas"
            tom="roxo"
            valor={fichas.length}
          />
          <MetricaPerfil
            icone={<Pill className="size-4" aria-hidden="true" />}
            label="Medicamentos"
            tom="salvia"
            valor={medicamentos?.length ?? "—"}
          />
        </dl>
      </section>

      {profissional && abaAtual !== "sessoes" ? (
        <AvisoPendenciasRegistroSessaoCliente
          href={hrefAba("sessoes")}
          quantidade={agendamentosPendentesSessao.length}
        />
      ) : null}

      <AbasPerfilCliente abaAtual={abaAtual} abas={abasPerfil}>
        {abaAtual === "resumo" ? (
          <SecaoPerfil
            descricao="Dados principais para entender o tratamento antes de abrir os registros."
            icone={<HeartPulse className="size-4" aria-hidden="true" />}
            id="resumo"
            titulo="Resumo do cliente"
            tom="brand"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <CardResumo
                icone={<HeartPulse className="size-4" aria-hidden="true" />}
                tom="brand"
                titulo="Objetivo do tratamento"
                valor={cliente.objetivoTratamento}
              />
              <CardResumo
                icone={<ShieldCheck className="size-4" aria-hidden="true" />}
                tom="roxo"
                titulo="Alergias"
                valor={cliente.alergias || "Sem alergias conhecidas"}
              />
              <CardResumo
                icone={<Pill className="size-4" aria-hidden="true" />}
                tom="salvia"
                titulo="Medicamentos em uso"
                valor={medicamentosEmUso}
              />
              <CardResumo
                icone={<ClipboardList className="size-4" aria-hidden="true" />}
                tom="dourado"
                titulo="Histórico cirúrgico"
                valor={cliente.cirurgias || "Nenhuma cirurgia informada"}
              />
              <CardResumo
                icone={<Activity className="size-4" aria-hidden="true" />}
                tom="brand"
                titulo="Condições de saúde"
                valor={cliente.condicoesSaude}
              />
              <CardResumo
                icone={<ShieldCheck className="size-4" aria-hidden="true" />}
                tom="perigo"
                titulo="Contraindicações"
                valor={cliente.contraindicacoes}
              />
              {observacoesInternas ? (
                <CardResumo
                  icone={<NotebookPen className="size-4" aria-hidden="true" />}
                  tom="roxo"
                  titulo="Observações internas"
                  valor={observacoesInternas}
                />
              ) : null}
              <CardResumo
                icone={<TrendingUp className="size-4" aria-hidden="true" />}
                tom="salvia"
                titulo="Resultados acumulados"
                valor={
                  reducaoAcumulada > 0
                    ? `Redução total de ${formatarCm(reducaoAcumulada)} nas medidas acompanhadas.`
                    : "Ainda não há evolução de medidas suficiente para calcular um resultado acumulado."
                }
              />
            </div>
          </SecaoPerfil>
        ) : null}

        {abaAtual === "fichas" ? (
          <SecaoPerfil
            acao={
              profissional ? (
                <div className="flex flex-wrap gap-3">
                  <SeletorModeloFicha
                    clienteId={id}
                    modelos={modelosParaSeletor}
                    servicos={servicosParaFichas}
                  />
                  <Link
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-roxo/25 bg-surface px-4 text-sm font-semibold text-roxo shadow-sm transition hover:bg-lilas/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:w-auto"
                    href="/painel/fichas/modelos"
                  >
                    <LayoutTemplate className="size-4" aria-hidden />
                    Criar modelo
                  </Link>
                </div>
              ) : null
            }
            descricao="Anamneses e avaliações vinculadas ao prontuário."
            icone={<FileText className="size-4" aria-hidden="true" />}
            id="fichas"
            titulo="Fichas de avaliação"
            tom="roxo"
          >
            <ListaFichas
              clienteNome={cliente.nome}
              fichas={fichasParaLista}
              modelos={modelosResumo}
              podeGerenciar={profissional}
              servicos={servicosParaFichas}
            />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "agendamentos" && dadosSessoes ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<CalendarClock className="size-4" aria-hidden />}
                rotuloBotao="Novo agendamento"
                titulo="Novo agendamento"
              >
                <FormularioAgendamento
                  clienteFixoId={id}
                  clientes={[]}
                  pacotes={pacotesAtivosDoClienteParaSelecao}
                  profissionais={dadosSessoes[3].map((p) => ({
                    id: p.id,
                    nome: p.name ?? p.email ?? "",
                  }))}
                  servicos={dadosSessoes[1].map((s) => ({ id: s.id, nome: s.nome }))}
                />
              </ModalFormulario>
            }
            descricao="Atendimentos marcados, com status e histórico completo."
            icone={<CalendarClock className="size-4" aria-hidden="true" />}
            id="agendamentos"
            titulo="Agendamentos"
            tom="dourado"
          >
            <ListaAgendamentosCliente
              agendamentos={agendamentosParaPerfil}
              clienteId={id}
              clienteNome={cliente.nome}
              pacotes={todosPacotesDoClienteParaSelecao}
              profissionais={dadosSessoes[3].map((p) => ({
                id: p.id,
                nome: p.name ?? p.email ?? "",
              }))}
              servicos={dadosSessoes[1].map((s) => ({ id: s.id, nome: s.nome }))}
            />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "sessoes" && dadosSessoes ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<NotebookPen className="size-4" aria-hidden />}
                rotuloBotao="Nova sessão"
                titulo="Nova sessão"
              >
                <FormularioSessao
                  agendamentos={agendamentosParaSessoes}
                  clienteId={id}
                  pacotes={pacotesParaSessoes}
                  servicos={servicosParaSessoes}
                />
              </ModalFormulario>
            }
            descricao="Registro clínico dos atendimentos realizados."
            icone={<NotebookPen className="size-4" aria-hidden="true" />}
            id="sessoes"
            titulo="Sessões realizadas"
            tom="brand"
          >
            <ListaSessoesGerenciavel
              agendamentoAbrirModalId={novoAtendimento}
              agendamentos={agendamentosParaSessoes}
              agendamentosPendentes={agendamentosPendentesSessao}
              clienteId={id}
              pacotes={pacotesParaSessoes}
              servicos={servicosParaSessoes}
              sessoes={sessoesParaLista}
            />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "medidas" && dadosSessoes && evolucaoMedidas ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<Ruler className="size-4" aria-hidden />}
                rotuloBotao="Nova medida"
                titulo="Nova medida"
              >
                <FormularioMedida clienteId={id} sessoes={sessoesParaSelecao} />
              </ModalFormulario>
            }
            descricao="Comparativo de medidas por região acompanhada."
            icone={<Ruler className="size-4" aria-hidden="true" />}
            id="medidas"
            titulo="Evolução de medidas"
            tom="salvia"
          >
            <div className="grid gap-6">
              <CardsEvolucao evolucao={evolucaoMedidas} />
              <GraficoMedidas medidas={medidasBrutas ?? []} />
              <HistoricoMedidasGerenciavel
                medidas={medidasParaLista}
                sessoes={sessoesParaSelecao}
              />
            </div>
          </SecaoPerfil>
        ) : null}

        {abaAtual === "pacotes" ? (
          <SecaoPerfil
            descricao="Pacotes contratados, progresso e situação de pagamento."
            icone={<PackageCheck className="size-4" aria-hidden="true" />}
            id="pacotes"
            titulo="Pacotes"
            tom="dourado"
          >
            <ListaPacotesPerfil pacotes={pacotes} />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "biometria" ? (
          <SecaoPerfil
            descricao="Consentimento e digitais cadastradas para check-in biométrico."
            icone={<Fingerprint className="size-4" aria-hidden="true" />}
            id="biometria"
            titulo="Biometria"
            tom="salvia"
          >
            <div className="grid gap-4">
              {!cliente.consentimentoBiometria ? (
                <form action={registrarConsentimentoBiometria} className="flex flex-wrap gap-3">
                  <input name="clienteId" type="hidden" value={id} />
                  <input name="consentimento" type="hidden" value="true" />
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-roxo transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    type="submit"
                  >
                    <Fingerprint className="size-4" aria-hidden="true" />
                    Registrar consentimento de biometria
                  </button>
                </form>
              ) : (
                <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                  Cliente liberado para cadastro de digital — busque o nome dele na aba
                  &quot;Cadastrar&quot; da ponte de biometria.
                </p>
              )}

              <ListaBiometriasPerfil biometrias={biometrias} clienteId={id} />
            </div>
          </SecaoPerfil>
        ) : null}

        {abaAtual === "fotos" && dadosSessoes && fotos ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<ImagePlus className="size-4" aria-hidden />}
                rotuloBotao="Nova foto"
                titulo="Nova foto"
              >
                <FormularioFoto clienteId={id} sessoes={sessoesParaSelecao} />
              </ModalFormulario>
            }
            descricao="Registro visual de antes, depois e acompanhamento."
            icone={<ImagePlus className="size-4" aria-hidden="true" />}
            id="fotos"
            titulo="Fotos"
            tom="roxo"
          >
            <GaleriaFotos fotos={fotos} podeExcluir />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "documentos" && documentos ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<FileText className="size-4" aria-hidden />}
                rotuloBotao="Novo documento"
                titulo="Emitir documento"
              >
                <FormularioDocumento clienteId={id} />
              </ModalFormulario>
            }
            descricao="Contratos, termos e orientações emitidas."
            icone={<FileText className="size-4" aria-hidden="true" />}
            id="documentos"
            titulo="Documentos e termos"
            tom="neutro"
          >
            <ListaDocumentosPerfil clienteId={id} documentos={documentos} />
          </SecaoPerfil>
        ) : null}

        {abaAtual === "medicamentos" && medicamentos ? (
          <SecaoPerfil
            acao={
              <ModalFormulario
                icone={<Pill className="size-4" aria-hidden />}
                rotuloBotao="Novo medicamento"
                titulo="Registrar medicamento"
              >
                <FormularioMedicamento clienteId={id} />
              </ModalFormulario>
            }
            descricao="Medicamentos informados e alertas de segurança."
            icone={<Pill className="size-4" aria-hidden="true" />}
            id="medicamentos"
            titulo="Medicamentos"
            tom="salvia"
          >
            <ListaMedicamentosGerenciavel clienteId={id} medicamentos={medicamentosParaLista} />
          </SecaoPerfil>
        ) : null}
      </AbasPerfilCliente>
    </div>
  );
}
