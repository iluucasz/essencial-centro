/**
 * Descobre de qual cliente é o PDF anexado ao assistente — o caso concreto é o boletim de
 * biorressonância, que sai do aparelho com o nome do paciente no arquivo e no cabeçalho.
 *
 * Em vez de tentar **extrair** um nome desconhecido do documento (frágil: cada aparelho formata de
 * um jeito), cruza a lista de clientes **já cadastrados** contra o nome do arquivo e o começo do
 * texto. Isso nunca inventa gente e degrada bem: no pior caso não acha ninguém e a profissional
 * escolhe à mão. Palpite nenhum vira registro sozinho — quem confirma é sempre a profissional.
 */

export type ClienteCandidato = { id: string; nome: string };

export type CorrespondenciaCliente = {
  cliente: ClienteCandidato;
  /** 0–1: fração dos termos significativos do nome encontrados no documento. */
  confianca: number;
  /** Outro cliente empatou na mesma pontuação — o palpite não serve, some com a pré-seleção. */
  ambigua: boolean;
};

/** Partículas que não identificam ninguém sozinhas — "Maria DE Souza" casaria com qualquer um. */
const PARTICULAS = new Set(["de", "do", "da", "dos", "das", "e", "di", "del", "van", "von", "la"]);

/** Só o começo do PDF interessa: é onde fica o cabeçalho de identificação do paciente. */
const CARACTERES_CABECALHO = 2000;

/** Abaixo disso o palpite atrapalha mais do que ajuda — melhor não sugerir nada. */
const CONFIANCA_MINIMA = 0.75;

export function normalizarParaBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function termosSignificativos(nome: string) {
  return normalizarParaBusca(nome)
    .split(" ")
    .filter((termo) => termo.length > 1 && !PARTICULAS.has(termo));
}

/**
 * Casa por palavra inteira, nunca por substring: "Ana" não pode casar dentro de "Adriana". Um único
 * termo isolado também não basta — só vale se o nome completo aparecer colado no documento.
 */
function pontuar(nome: string, alvoNormalizado: string, palavrasAlvo: Set<string>) {
  const termos = termosSignificativos(nome);
  if (termos.length === 0) return 0;

  // Os espaços nas pontas fazem o nome completo casar por palavra inteira, e não por substring —
  // sem eles "Ana" casaria dentro de "Adriana".
  if (` ${alvoNormalizado} `.includes(` ${normalizarParaBusca(nome)} `)) return 1;

  const encontrados = termos.filter((termo) => palavrasAlvo.has(termo));
  if (encontrados.length < 2) return 0;

  return encontrados.length / termos.length;
}

/**
 * Melhor candidato para o dono do documento, ou `null` quando nada passa da confiança mínima.
 * `ambigua` marca empate no topo — dois clientes homônimos, por exemplo.
 */
export function encontrarClienteDoDocumento({
  clientes,
  nomeArquivo,
  texto,
}: {
  clientes: ClienteCandidato[];
  nomeArquivo: string;
  texto: string;
}): CorrespondenciaCliente | null {
  const alvo = normalizarParaBusca(`${nomeArquivo} ${texto.slice(0, CARACTERES_CABECALHO)}`);
  const palavrasAlvo = new Set(alvo.split(" "));

  const pontuados = clientes
    .map((cliente) => ({ cliente, confianca: pontuar(cliente.nome, alvo, palavrasAlvo) }))
    .filter((item) => item.confianca >= CONFIANCA_MINIMA)
    .sort((a, b) => b.confianca - a.confianca);

  const melhor = pontuados[0];
  if (!melhor) return null;

  return {
    cliente: melhor.cliente,
    confianca: melhor.confianca,
    ambigua: pontuados.some(
      (item) => item.cliente.id !== melhor.cliente.id && item.confianca === melhor.confianca,
    ),
  };
}
