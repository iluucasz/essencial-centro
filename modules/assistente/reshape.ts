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

export function reshapeResumoEvolucao(r: {
  totalSessoes: number;
  evolucaoDor: unknown;
  evolucaoMedidas: unknown;
  fotos: { dataFoto: Date }[];
  pacotes: { servicoNome: string; progresso: unknown; situacaoPagamento: string }[];
}) {
  return {
    totalSessoes: r.totalSessoes,
    evolucaoDor: r.evolucaoDor,
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
