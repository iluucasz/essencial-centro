type DocumentoResumoPdfInput = {
  conteudo: string;
  nomeArquivo: string;
};

export type DocumentoResumoPdf = {
  titulo: string;
  nomeArquivo: string;
  nomeDownload: string;
  conteudo: string;
};

const termosResumo = ["resuma", "resumir", "resumo", "sintese", "sumario"];

const termosDocumento = ["doc", "documento"];
const verbosCriacaoDocumento = ["cria", "crie", "faca", "faz", "gera", "gere", "gerar", "monte"];
const prefixosMensagemAutomatica = ["anexei o pdf", "pdf anexado"];

/** Frases com que o assistente encerra oferecendo próximos passos — poluem o PDF baixado. */
const frasesConviteContinuacao = [
  "gostaria de seguir",
  "gostaria de prosseguir",
  "prefere que eu",
  "quer que eu prossiga",
  "quer que eu siga",
  "como quer seguir",
  "como quer prosseguir",
  "como prefere seguir",
  "como prosseguir",
  "como devo seguir",
];
const opcoesMenuContinuacao = [
  "visao geral",
  "leitura por assunto",
  "pontos de atencao",
  "duvida especifica",
];

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarNomeDownload(nomeArquivo: string) {
  const base = nomeArquivo
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "pdf"}-resumo.pdf`;
}

export function deveGerarDocumentoResumoPdf({
  pergunta,
  possuiAnexo,
}: {
  pergunta: string;
  possuiAnexo: boolean;
}) {
  if (!possuiAnexo) return false;

  const texto = normalizarTexto(pergunta);

  // Primeira interação automática ao anexar o PDF: já oferece o resumo para baixar.
  if (prefixosMensagemAutomatica.some((prefixo) => texto.startsWith(prefixo))) return true;

  const pediuResumo = termosResumo.some((termo) => texto.includes(termo));
  const pediuDocumento =
    termosDocumento.some((termo) => texto.includes(termo)) &&
    verbosCriacaoDocumento.some((verbo) => texto.includes(verbo));

  return pediuResumo || pediuDocumento;
}

function ehConviteDeContinuacao(linha: string) {
  if (!linha.trim().endsWith("?")) return false;

  const normal = normalizarTexto(linha);

  if (frasesConviteContinuacao.some((frase) => normal.includes(frase))) return true;

  return opcoesMenuContinuacao.filter((opcao) => normal.includes(opcao)).length >= 2;
}

/**
 * Remove o convite final de próximos passos ("Como você gostaria de seguir: ...?"). Ele é útil no
 * chat, mas fica deslocado no PDF de resumo que a profissional baixa — ainda mais agora que o card
 * aparece já na primeira leitura automática do documento.
 */
export function removerConviteContinuacao(conteudo: string) {
  const linhas = conteudo.split("\n");

  while (linhas.length > 0) {
    const ultima = linhas[linhas.length - 1].trim();

    if (ultima === "") {
      linhas.pop();
      continue;
    }

    if (ehConviteDeContinuacao(ultima)) {
      linhas.pop();
      continue;
    }

    break;
  }

  return linhas.join("\n").trim();
}

export function montarDocumentoResumoPdf({
  conteudo,
  nomeArquivo,
}: DocumentoResumoPdfInput): DocumentoResumoPdf {
  const titulo = `Resumo do PDF: ${nomeArquivo}`;
  const corpo = removerConviteContinuacao(conteudo);

  return {
    titulo,
    nomeArquivo,
    nomeDownload: normalizarNomeDownload(nomeArquivo),
    conteudo: [`# ${titulo}`, "", corpo].join("\n"),
  };
}
