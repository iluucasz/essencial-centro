import { PDFParse } from "pdf-parse";

import {
  LIMITE_BYTES_PDF_ASSISTENTE,
  LIMITE_CARACTERES_CONTEXTO_PDF_ASSISTENTE,
  LIMITE_CARACTERES_TEXTO_PDF_ASSISTENTE,
  SOBREPOSICAO_TRECHO_PDF_ASSISTENTE,
  TAMANHO_TRECHO_PDF_ASSISTENTE,
} from "./config";
import type { AnexoAssistente } from "./schema";

type MetadadosArquivoPdf = {
  nome: string;
  tipo: string;
  tamanhoBytes: number;
};

type ResultadoValidacaoPdf =
  { valido: true; nomeArquivo: string } | { valido: false; erro: string };

export type TrechoPdfAssistente = {
  indice: number;
  inicio: number;
  fim: number;
  texto: string;
};

const palavrasVaziasBusca = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "que",
  "qual",
  "quais",
  "sobre",
  "uma",
  "um",
]);

const termosPanoramicos = [
  "analise",
  "analisar",
  "arquivo",
  "documento",
  "geral",
  "inteiro",
  "pdf",
  "resuma",
  "resumir",
  "resumo",
  "sintese",
  "todo",
];

export function podeUsarAnexosAssistente(papel: string | null | undefined) {
  return papel === "profissional";
}

export function normalizarNomeArquivo(nome: string) {
  return nome.split(/[\\/]/).pop()?.trim().slice(0, 180) || "documento.pdf";
}

export function validarArquivoPdf({
  nome,
  tipo,
  tamanhoBytes,
}: MetadadosArquivoPdf): ResultadoValidacaoPdf {
  const nomeArquivo = normalizarNomeArquivo(nome);
  const tipoNormalizado = tipo.toLowerCase();
  const ehPdf = tipoNormalizado === "application/pdf" || nomeArquivo.toLowerCase().endsWith(".pdf");

  if (!ehPdf) {
    return { valido: false, erro: "Envie um arquivo PDF." };
  }

  if (tamanhoBytes <= 0) {
    return { valido: false, erro: "O PDF enviado parece estar vazio." };
  }

  if (tamanhoBytes > LIMITE_BYTES_PDF_ASSISTENTE) {
    return { valido: false, erro: "O PDF precisa ter até 20 MB." };
  }

  return { valido: true, nomeArquivo };
}

export function normalizarTextoPdf(texto: string) {
  return texto
    .replace(/\r/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function limitarTextoExtraidoPdf(
  texto: string,
  limiteCaracteres: number = LIMITE_CARACTERES_TEXTO_PDF_ASSISTENTE,
) {
  const normalizado = normalizarTextoPdf(texto);

  if (normalizado.length <= limiteCaracteres) return normalizado;

  return `${normalizado.slice(0, limiteCaracteres).trim()}\n\n[Texto do PDF truncado para caber no assistente.]`;
}

export async function extrairTextoPdf(data: Uint8Array) {
  const parser = new PDFParse({ data });

  try {
    const resultado = await parser.getText();
    const texto = limitarTextoExtraidoPdf(resultado.text);

    return {
      texto,
      totalCaracteres: texto.length,
      totalPaginas: resultado.total || resultado.pages.length || null,
    };
  } finally {
    await parser.destroy();
  }
}

export function dividirTextoEmTrechos(
  texto: string,
  tamanhoTrecho: number = TAMANHO_TRECHO_PDF_ASSISTENTE,
  sobreposicao: number = SOBREPOSICAO_TRECHO_PDF_ASSISTENTE,
): TrechoPdfAssistente[] {
  const normalizado = normalizarTextoPdf(texto);
  const tamanhoSeguro = Math.max(500, tamanhoTrecho);
  const sobreposicaoSegura = Math.min(Math.max(0, sobreposicao), tamanhoSeguro - 100);
  const trechos: TrechoPdfAssistente[] = [];
  let inicio = 0;

  while (inicio < normalizado.length) {
    const fim = Math.min(inicio + tamanhoSeguro, normalizado.length);

    trechos.push({
      indice: trechos.length,
      inicio,
      fim,
      texto: normalizado.slice(inicio, fim).trim(),
    });

    if (fim >= normalizado.length) break;

    inicio = fim - sobreposicaoSegura;
  }

  return trechos.filter((trecho) => trecho.texto.length > 0);
}

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extrairTermosBusca(pergunta: string) {
  const termos = normalizarBusca(pergunta)
    .split(/[^a-z0-9]+/)
    .filter((termo) => termo.length >= 3 && !palavrasVaziasBusca.has(termo));

  return [...new Set(termos)];
}

function ehPerguntaPanoramica(pergunta: string) {
  const perguntaNormalizada = normalizarBusca(pergunta);
  const termos = extrairTermosBusca(pergunta);

  return (
    termos.length === 0 || termosPanoramicos.some((termo) => perguntaNormalizada.includes(termo))
  );
}

function contarOcorrencias(texto: string, termo: string) {
  let ocorrencias = 0;
  let posicao = texto.indexOf(termo);

  while (posicao !== -1) {
    ocorrencias += 1;
    posicao = texto.indexOf(termo, posicao + termo.length);
  }

  return ocorrencias;
}

function pontuarTrecho(trecho: TrechoPdfAssistente, termos: string[]) {
  const texto = normalizarBusca(trecho.texto);

  return termos.reduce((total, termo) => {
    const peso = termo.length >= 6 ? 2 : 1;

    return total + contarOcorrencias(texto, termo) * peso;
  }, 0);
}

function adicionarTrechoSelecionado({
  limiteCaracteres,
  selecionados,
  trecho,
}: {
  limiteCaracteres: number;
  selecionados: TrechoPdfAssistente[];
  trecho: TrechoPdfAssistente;
}) {
  if (selecionados.some((selecionado) => selecionado.indice === trecho.indice)) return;

  const caracteresAtuais = selecionados.reduce(
    (total, selecionado) => total + selecionado.texto.length,
    0,
  );
  const espacoRestante = limiteCaracteres - caracteresAtuais;

  if (espacoRestante <= 0) return;

  if (trecho.texto.length <= espacoRestante) {
    selecionados.push(trecho);
    return;
  }

  if (espacoRestante >= 500) {
    selecionados.push({
      ...trecho,
      fim: trecho.inicio + espacoRestante,
      texto: trecho.texto.slice(0, espacoRestante),
    });
  }
}

function selecionarAmostraPanoramica(trechos: TrechoPdfAssistente[], limiteCaracteres: number) {
  const selecionados: TrechoPdfAssistente[] = [];
  const indicesPreferidos = [
    0,
    Math.floor(trechos.length * 0.25),
    Math.floor(trechos.length * 0.5),
    Math.floor(trechos.length * 0.75),
    trechos.length - 1,
  ];

  for (const indice of [...new Set(indicesPreferidos)].filter((indice) => indice >= 0)) {
    adicionarTrechoSelecionado({ limiteCaracteres, selecionados, trecho: trechos[indice] });
  }

  for (const trecho of trechos) {
    adicionarTrechoSelecionado({ limiteCaracteres, selecionados, trecho });
  }

  return selecionados.sort((a, b) => a.indice - b.indice);
}

export function selecionarTrechosDocumento({
  limiteCaracteres = LIMITE_CARACTERES_CONTEXTO_PDF_ASSISTENTE,
  pergunta,
  texto,
}: {
  texto: string;
  pergunta: string;
  limiteCaracteres?: number;
}) {
  const trechos = dividirTextoEmTrechos(texto);

  if (trechos.length === 0) return [];
  if (ehPerguntaPanoramica(pergunta)) return selecionarAmostraPanoramica(trechos, limiteCaracteres);

  const termos = extrairTermosBusca(pergunta);
  const ranqueados = trechos
    .map((trecho) => ({ trecho, pontos: pontuarTrecho(trecho, termos) }))
    .filter(({ pontos }) => pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.trecho.indice - b.trecho.indice);

  if (ranqueados.length === 0) return selecionarAmostraPanoramica(trechos, limiteCaracteres);

  const selecionados: TrechoPdfAssistente[] = [];

  adicionarTrechoSelecionado({ limiteCaracteres, selecionados, trecho: trechos[0] });

  for (const { trecho } of ranqueados) {
    adicionarTrechoSelecionado({ limiteCaracteres, selecionados, trecho });
  }

  return selecionados.sort((a, b) => a.indice - b.indice);
}

export function montarContextoAnexoAssistente({
  anexo,
  pergunta,
}: {
  anexo: Pick<
    AnexoAssistente,
    "nomeArquivo" | "textoExtraido" | "totalCaracteres" | "totalPaginas"
  >;
  pergunta: string;
}) {
  const trechos = selecionarTrechosDocumento({ pergunta, texto: anexo.textoExtraido });
  const paginas = anexo.totalPaginas ? String(anexo.totalPaginas) : "não identificado";
  const conteudoTrechos = trechos
    .map(
      (trecho) =>
        `--- Trecho ${trecho.indice + 1} do PDF (caracteres ${trecho.inicio}-${trecho.fim}) ---\n${trecho.texto}`,
    )
    .join("\n\n");

  return [
    `Arquivo PDF ativo: ${anexo.nomeArquivo}`,
    `Páginas: ${paginas}`,
    `Caracteres extraidos: ${anexo.totalCaracteres}`,
    "Trechos selecionados para esta pergunta:",
    conteudoTrechos || "Nenhum texto legivel foi encontrado no PDF.",
  ].join("\n");
}
