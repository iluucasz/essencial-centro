import { LIMITE_CARACTERES_CONTEUDO_DOCUMENTO, LIMITE_CARACTERES_TEXTO_LONGO } from "./config";

export function truncarTexto(texto: string | null, limite: number): string | null {
  if (texto === null) return null;

  return texto.length <= limite ? texto : `${texto.slice(0, limite)}…`;
}

/**
 * Converte recursivamente qualquer `Date` em string ISO. A saída das ferramentas vira JSON no
 * histórico do chat (useChat) e é revalidada pelo AI SDK ao remontar as mensagens do modelo no
 * turno seguinte — um `Date` cru quebra essa validação ("expected string, received Date") e
 * derruba o assistente inteiro. Aplicado a toda ferramenta em tools.ts, então nenhum campo de data
 * (inclusive os aninhados em `unknown`, como evolução de medidas) escapa.
 */
export function serializarDatas<T>(valor: T): T {
  if (valor instanceof Date) return valor.toISOString() as unknown as T;

  if (Array.isArray(valor)) return valor.map(serializarDatas) as unknown as T;

  if (valor !== null && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([chave, item]) => [chave, serializarDatas(item)]),
    ) as T;
  }

  return valor;
}

export function limitarLista<T>(lista: T[], limite: number): T[] {
  return lista.slice(0, limite);
}

export function reshapeCliente(c: {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
}) {
  return {
    id: c.id,
    nome: c.nome,
    email: c.email,
    telefone: c.telefone,
    url: `/painel/clientes/${c.id}`,
  };
}

type EvolucaoDorPeriodo = {
  dorInicial: number;
  dorAtual: number;
  mediaVariacao: number;
  totalRegistros: number;
  melhoraGeral: boolean;
} | null;

/**
 * `mediaVariacao` cru (depois - antes, média entre sessões) é ambíguo sem contexto — negativo
 * significa que a dor tende a CAIR de antes pra depois DENTRO de cada sessão (bom sinal pontual),
 * o oposto do que "variação" sugere à primeira leitura. Numa resposta real, o modelo leu esse
 * número negativo como "indica piora" — o contrário do que ele mede — mesmo com `melhoraGeral`
 * (o sinal correto de tendência geral, já calculado) disponível ao lado. Renomear pra deixar o
 * significado explícito no próprio nome do campo, sem o modelo ter que adivinhar.
 */
function reshapeEvolucaoDor(evolucaoDor: EvolucaoDorPeriodo) {
  if (!evolucaoDor) return null;

  return {
    dorInicial: evolucaoDor.dorInicial,
    dorAtual: evolucaoDor.dorAtual,
    houveMelhoraGeralDaDorInicialParaAtual: evolucaoDor.melhoraGeral,
    mediaDeQuantoADorCaiDentroDeCadaSessao: -evolucaoDor.mediaVariacao,
    totalRegistrosComDor: evolucaoDor.totalRegistros,
  };
}

export function reshapeResumoEvolucao(r: {
  totalSessoes: number;
  evolucaoDor: EvolucaoDorPeriodo;
  evolucaoMedidas: unknown;
  fotos: { dataFoto: Date }[];
  pacotes: { servicoNome: string; progresso: unknown; situacaoPagamento: string }[];
}) {
  return {
    totalSessoes: r.totalSessoes,
    evolucaoDor: reshapeEvolucaoDor(r.evolucaoDor),
    evolucaoMedidas: r.evolucaoMedidas,
    totalFotos: r.fotos.length,
    ultimaFotoEm: r.fotos[0]?.dataFoto ?? null,
    pacotesAtivos: r.pacotes.map((p) => ({
      servicoNome: p.servicoNome,
      progresso: p.progresso,
      situacaoPagamento: p.situacaoPagamento,
    })),
  };
}

export function reshapeMedicamento(m: {
  nome: string;
  dosagem: string | null;
  frequencia: string | null;
  profissionalPrescritor: string | null;
  dataInicio: Date | null;
  alergiaRelacionada: string | null;
  alertaInteracao: string | null;
  fonteAlerta: string | null;
  verificadoEm: Date | null;
  verificadoPorNome: string | null;
  criadoEm: Date;
}) {
  const {
    nome,
    dosagem,
    frequencia,
    profissionalPrescritor,
    dataInicio,
    alergiaRelacionada,
    alertaInteracao,
    fonteAlerta,
    verificadoEm,
    verificadoPorNome,
    criadoEm,
  } = m;

  return {
    nome,
    dosagem,
    frequencia,
    profissionalPrescritor,
    dataInicio,
    alergiaRelacionada,
    alertaInteracao,
    fonteAlerta,
    verificadoEm,
    verificadoPorNome,
    criadoEm,
  };
}

export function reshapeLancamento(l: {
  tipo: string;
  categoria: string;
  descricao: string | null;
  valorCentavos: number;
  data: Date;
  formaPagamento: string | null;
  situacao: string;
  clienteNome: string | null;
}) {
  return {
    tipo: l.tipo,
    categoria: l.categoria,
    descricao: l.descricao,
    valorReais: l.valorCentavos / 100,
    data: l.data,
    formaPagamento: l.formaPagamento,
    situacao: l.situacao,
    clienteNome: l.clienteNome,
  };
}

/**
 * `calcularResumoFinanceiro` devolve tudo em centavos (uso interno, telas fazem a própria
 * formatação). Sem essa conversão o modelo recebia `receitasPagas: 53000` — um inteiro sem
 * unidade no nome — e já apresentou isso direto como "R$ 53.000,00" numa resposta real, 100x o
 * valor verdadeiro (R$ 530,00). Mesma convenção de `reshapeLancamento`/`reshapePacote`: nunca
 * manda centavos cru pro modelo, sempre `...Reais` já dividido.
 */
export function reshapeResumoFinanceiro(r: {
  receitasPagas: number;
  despesasPagas: number;
  saldo: number;
  receitasPendentes: number;
  despesasPendentes: number;
}) {
  return {
    receitasPagasReais: r.receitasPagas / 100,
    despesasPagasReais: r.despesasPagas / 100,
    saldoReais: r.saldo / 100,
    receitasPendentesReais: r.receitasPendentes / 100,
    despesasPendentesReais: r.despesasPendentes / 100,
  };
}

export function reshapeProduto(p: {
  nome: string;
  unidade: string | null;
  estoqueMinimo: number | null;
  disponivel: number;
  avisoEstoqueBaixo: boolean;
}) {
  return {
    nome: p.nome,
    unidade: p.unidade,
    estoqueMinimo: p.estoqueMinimo,
    disponivel: p.disponivel,
    avisoEstoqueBaixo: p.avisoEstoqueBaixo,
  };
}

/**
 * `agendamento.inicio` guarda horário de parede de Brasília gravado direto no campo UTC (ver
 * `agoraBrasilia` em lib/utils.ts) — igual ao formatador de `modules/agenda/components/lista-agenda.tsx`,
 * ler com timeZone "UTC" é o jeito CERTO de pegar os dígitos de volta sem turno nenhum.
 */
const formatadorHorarioAgendamento = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Nome do dia da semana por extenso (ex.: "terça-feira"). Existe porque o modelo, calculando o
 * dia da semana de cabeça a partir de `inicio` pra intervalos maiores que a semana atual (ex.:
 * "próximos 14 dias"), já errou de verdade — chamou 15/09/2026 de "Segunda" quando era terça.
 * `timeZone: "UTC"` de propósito, mesma convenção de `formatadorHorarioAgendamento` acima.
 */
const formatadorDiaSemanaAgendamento = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "UTC",
});

export function reshapeAgendamento(a: {
  inicio: Date;
  duracaoMinutos: number;
  status: string;
  modalidade: string;
  clienteNome: string;
  servicoNome: string;
  profissionalNome: string | null;
}) {
  return {
    inicio: a.inicio,
    /**
     * Horário já formatado (ex.: "18:00"), do mesmo jeito que a tela de agenda mostra. Existe
     * porque o modelo, ao ver só `inicio` como ISO com "Z", às vezes "ajusta" o fuso por conta
     * própria (subtraindo 3h) mesmo esse "Z" não representando um instante UTC real — e numa
     * resposta real chegou a inventar "18h (horário local ajustado)" pra um agendamento às 21h.
     * Mandando o horário pronto, não sobra conta de fuso pro modelo errar.
     */
    horario: formatadorHorarioAgendamento.format(a.inicio),
    diaSemana: formatadorDiaSemanaAgendamento.format(a.inicio),
    duracaoMinutos: a.duracaoMinutos,
    status: a.status,
    modalidade: a.modalidade,
    clienteNome: a.clienteNome,
    servicoNome: a.servicoNome,
    profissionalNome: a.profissionalNome,
  };
}

export function reshapePacote(p: {
  clienteNome: string;
  servicoNome: string;
  quantidadeSessoes: number;
  progresso: unknown;
  valorCentavos: number | null;
  situacaoPagamento: string;
  ativo: boolean;
}) {
  return {
    clienteNome: p.clienteNome,
    servicoNome: p.servicoNome,
    quantidadeSessoes: p.quantidadeSessoes,
    progresso: p.progresso,
    valorReais: p.valorCentavos === null ? null : p.valorCentavos / 100,
    situacaoPagamento: p.situacaoPagamento,
    ativo: p.ativo,
  };
}

export function reshapeDocumento(d: {
  tipo: string;
  titulo: string;
  conteudo: string;
  status: string;
  assinadoEm: Date | null;
  criadoEm: Date;
}) {
  return {
    tipo: d.tipo,
    titulo: d.titulo,
    status: d.status,
    assinadoEm: d.assinadoEm,
    criadoEm: d.criadoEm,
    conteudoResumo: truncarTexto(d.conteudo, LIMITE_CARACTERES_CONTEUDO_DOCUMENTO),
  };
}

export function reshapeAnalise(a: {
  tipo: string;
  titulo: string;
  temArquivo: boolean;
  analiseIa: string;
  observacaoProfissional: string | null;
  status: string;
  revisadoEm: Date | null;
  criadoEm: Date;
}) {
  return {
    tipo: a.tipo,
    titulo: a.titulo,
    temArquivo: a.temArquivo,
    resumoAnaliseIa: truncarTexto(a.analiseIa, LIMITE_CARACTERES_CONTEUDO_DOCUMENTO),
    observacaoProfissional: a.observacaoProfissional,
    status: a.status,
    revisadoEm: a.revisadoEm,
    criadoEm: a.criadoEm,
  };
}

export function reshapeSessao(s: {
  dataHora: Date;
  duracaoMinutos: number | null;
  regiaoTratada: string | null;
  condicaoAntes: string | null;
  relatoCliente: string | null;
  escalaDorAntes: number | null;
  escalaDorDepois: number | null;
  avaliacaoProfissional: string | null;
  orientacoesPosAtendimento: string | null;
  proximaSessaoRecomendada: Date | null;
  presencaConfirmada: boolean;
}) {
  return {
    dataHora: s.dataHora,
    duracaoMinutos: s.duracaoMinutos,
    regiaoTratada: s.regiaoTratada,
    condicaoAntes: truncarTexto(s.condicaoAntes, LIMITE_CARACTERES_TEXTO_LONGO),
    relatoCliente: truncarTexto(s.relatoCliente, LIMITE_CARACTERES_TEXTO_LONGO),
    escalaDorAntes: s.escalaDorAntes,
    escalaDorDepois: s.escalaDorDepois,
    avaliacaoProfissional: truncarTexto(s.avaliacaoProfissional, LIMITE_CARACTERES_TEXTO_LONGO),
    orientacoesPosAtendimento: truncarTexto(
      s.orientacoesPosAtendimento,
      LIMITE_CARACTERES_TEXTO_LONGO,
    ),
    proximaSessaoRecomendada: s.proximaSessaoRecomendada,
    presencaConfirmada: s.presencaConfirmada,
  };
}
