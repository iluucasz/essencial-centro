import { analisarMarkdownSimples } from "@/modules/assistente/markdown-simples";

/**
 * Preparação do texto do resumo ANTES de virar PDF. Fica separado de pdf-resumo.ts (que depende do
 * jsPDF) para ser testável em Node puro. Resolve dois problemas reais da saída do modelo:
 *
 * 1. Tipografia Unicode invisível (espaço fino, hífen não separável, subscrito) que a fonte padrão
 *    do jsPDF (helvetica/cp1252) não conhece — basta 1 caractere fora de Latin-1 numa linha para o
 *    jsPDF trocar a linha inteira para UTF-16, o que sai como "l e t r a   e s p a ç a d a" e ainda
 *    estoura a margem. Ver sanitizarTextoPdf.
 * 2. Markdown que o renderizador antigo jogava cru na página (tabelas, réguas ---, numeração
 *    duplicada de seção, rótulos em negrito perdidos). Ver analisarBlocosResumo.
 */

export type SegmentoResumo = { texto: string; negrito: boolean; url?: string };

export type BlocoResumo =
  | { tipo: "titulo"; nivel: 1 | 2 | 3; texto: string }
  | { tipo: "paragrafo"; segmentos: SegmentoResumo[] }
  | { tipo: "lista"; segmentos: SegmentoResumo[] }
  | { tipo: "tabela"; colunas: string[]; linhas: string[][] };

/**
 * Glifos tipográficos visíveis trocados por equivalentes Latin-1. Espaços Unicode e caracteres de
 * largura zero são tratados por código no laço (evita chaves duplicadas e ilegíveis aqui).
 */
const MAPA_SANITIZACAO: Record<string, string> = {
  "‐": "-",
  "‑": "-", // hífen não separável (o vilão do "3 6 meses")
  "‒": "-",
  "–": "-", // travessão curto (en dash)
  "—": "-", // travessão (em dash)
  "―": "-",
  "−": "-", // sinal de menos
  "‘": "'",
  "’": "'", // aspas curvas simples
  "‚": "'",
  "‛": "'",
  "“": '"',
  "”": '"', // aspas curvas duplas
  "„": '"',
  "′": "'",
  "″": '"',
  "…": "...", // reticências
  "•": "-", // bullet
  "⁃": "-",
  "≤": "<=",
  "≥": ">=",
  "≠": "!=",
  "≈": "~",
  "→": "->",
  "←": "<-",
  "✓": "-", // check
  "✔": "-",
};

const CARACTERES_LARGURA_ZERO = new Set(["​", "‌", "‍", "⁠", "﻿"]);

/**
 * Deixa o texto seguro para a fonte padrão do jsPDF: normaliza acentos pt-BR para a forma composta
 * (que cabe em Latin-1), troca tipografia Unicode por equivalentes ASCII e descarta qualquer resto
 * fora de Latin-1. Invariante garantida: todo code point do resultado é <= 0xFF.
 */
export function sanitizarTextoPdf(texto: string): string {
  let saida = "";

  for (const ch of texto.normalize("NFC")) {
    const codigo = ch.codePointAt(0) ?? 0;

    if (codigo <= 0xff) {
      saida += ch;
      continue;
    }

    const mapeado = MAPA_SANITIZACAO[ch];

    if (mapeado !== undefined) {
      saida += mapeado;
      continue;
    }

    if (CARACTERES_LARGURA_ZERO.has(ch)) continue;

    if (/\s/.test(ch)) {
      saida += " "; // espaço fino/inquebrável e afins viram espaço normal
      continue;
    }

    if (codigo >= 0x2080 && codigo <= 0x2089) {
      saida += String(codigo - 0x2080); // subscritos ₀-₉
      continue;
    }

    if (codigo >= 0x2074 && codigo <= 0x2079) {
      saida += String(codigo - 0x2070); // sobrescritos ⁴-⁹
      continue;
    }

    if (codigo === 0x2070) {
      saida += "0";
      continue;
    }

    // Desconhecido fora de Latin-1 (emoji, CJK…): descarta para não forçar UTF-16 no jsPDF.
  }

  return saida;
}

function textoPlano(texto: string): string {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function limparTitulo(texto: string): string {
  return textoPlano(texto)
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\d+[.)]\s*/, "") // remove numeração do modelo — a interface numera as seções
    .trim();
}

const rotuloNomeCliente = /^(cliente|paciente|nome)\s*:\s*(.+)$/i;

/**
 * Extrai o nome do cliente do resumo (primeira linha "Cliente:/Paciente:/Nome: ..."), para usar
 * como título da capa do PDF. Retorna só o nome (corta em vírgula, ex.: "Katia, 60 anos" → "Katia").
 */
export function extrairNomeClienteResumo(conteudo: string): string | null {
  for (const linha of sanitizarTextoPdf(conteudo).split("\n")) {
    const semMarcacao = linha
      .trim()
      .replace(/^[-*•]\s+/, "")
      .replace(/\*/g, "");
    const match = semMarcacao.match(rotuloNomeCliente);

    if (!match) continue;

    const valor = textoPlano(match[2])
      .split(",")[0]
      .replace(/[.;:]+$/, "")
      .trim();

    if (valor.length >= 2 && /\p{L}/u.test(valor)) return valor.slice(0, 60);
  }

  return null;
}

/** Converte **negrito** e [texto](url) do modelo em segmentos; o PDF ignora a url, o chat linka. */
export function segmentarInline(texto: string): SegmentoResumo[] {
  return analisarMarkdownSimples(texto)
    .map((pedaco): SegmentoResumo => {
      if (pedaco.tipo === "negrito") return { texto: pedaco.conteudo, negrito: true };
      if (pedaco.tipo === "link") return { texto: pedaco.texto, negrito: false, url: pedaco.url };

      return { texto: pedaco.conteudo, negrito: false };
    })
    .filter((segmento) => segmento.texto.length > 0);
}

/** Remove marcadores de citação que o modelo às vezes injeta (ex.: 【0†L1-L4】) — só poluem o texto. */
export function removerMarcadoresCitacao(texto: string): string {
  return texto.replace(/\s*【[^】]*】/g, "").replace(/\s*\[\d+†[^\]]*\]/g, "");
}

/** Linha inteira em itálico *assim* → tira os asteriscos (não renderizamos itálico real). */
function removerItalicoDeLinha(linha: string): string {
  const match = linha.match(/^\*([^*]+)\*$/);

  return match ? match[1].trim() : linha;
}

function ehReguaHorizontal(linha: string): boolean {
  const semEspaco = linha.replace(/\s+/g, "");

  return semEspaco.length >= 3 && /^[-*_]+$/.test(semEspaco);
}

function ehLinhaTabela(linha: string): boolean {
  return linha.startsWith("|") && linha.endsWith("|") && linha.length > 2;
}

function ehSeparadorTabela(linha: string): boolean {
  return ehLinhaTabela(linha) && /^\|[\s:|-]+\|$/.test(linha) && linha.includes("-");
}

function celulasDaLinha(linha: string): string[] {
  return linha
    .slice(1, -1)
    .split("|")
    .map((celula) => textoPlano(celula));
}

function montarTabela(linhas: string[]): Extract<BlocoResumo, { tipo: "tabela" }> | null {
  const linhasDados = linhas.filter((linha) => !ehSeparadorTabela(linha));

  if (linhasDados.length === 0) return null;

  const colunas = celulasDaLinha(linhasDados[0]);
  const corpo = linhasDados.slice(1).map(celulasDaLinha);

  return { tipo: "tabela", colunas, linhas: corpo };
}

/**
 * Parser de markdown do assistente em blocos estruturados, COMPARTILHADO entre o chat e o PDF —
 * é o que garante que os dois formatem igual (títulos, tabelas, listas, negrito). Cada linha de
 * origem vira um bloco próprio (não juntamos linhas): o modelo já escreve um tópico/rótulo por
 * linha, e juntar era justamente o que grudava "Cliente: … 69 kg Data do exame: …" numa frase só.
 * Não sanitiza para Latin-1 — isso é só do PDF e acontece na hora de desenhar (o chat renderiza
 * Unicode normalmente).
 */
export function analisarBlocos(conteudo: string): BlocoResumo[] {
  const linhas = removerMarcadoresCitacao(conteudo)
    .split("\n")
    .map((linha) => linha.trim());
  const blocos: BlocoResumo[] = [];
  let indice = 0;

  while (indice < linhas.length) {
    let linha = linhas[indice];

    if (!linha || ehReguaHorizontal(linha)) {
      indice += 1;
      continue;
    }

    if (ehLinhaTabela(linha)) {
      const linhasTabela: string[] = [];

      while (indice < linhas.length) {
        if (ehLinhaTabela(linhas[indice])) {
          linhasTabela.push(linhas[indice]);
          indice += 1;
        } else if (linhas[indice] === "" && ehLinhaTabela(linhas[indice + 1] ?? "")) {
          indice += 1; // o modelo às vezes separa as linhas da tabela com uma linha em branco
        } else {
          break;
        }
      }

      const tabela = montarTabela(linhasTabela);

      if (tabela) blocos.push(tabela);
      continue;
    }

    const cabecalho = linha.match(/^(#{1,6})\s+(.+)$/);

    if (cabecalho) {
      const nivel = Math.min(cabecalho[1].length, 3) as 1 | 2 | 3;
      const texto = limparTitulo(cabecalho[2]);

      if (texto) blocos.push({ tipo: "titulo", nivel, texto });
      indice += 1;
      continue;
    }

    // Linha inteira em negrito (sem valor depois) → subtítulo. "**Cliente:** Katia" NÃO cai aqui.
    if (/^\*\*[^*]+\*\*$/.test(linha)) {
      blocos.push({ tipo: "titulo", nivel: 3, texto: limparTitulo(linha) });
      indice += 1;
      continue;
    }

    // Citação "> ..." vira parágrafo comum (sem o marcador cru).
    if (/^>\s?/.test(linha)) linha = linha.replace(/^>\s?/, "");
    linha = removerItalicoDeLinha(linha);

    if (/^[-*•]\s+/.test(linha)) {
      blocos.push({ tipo: "lista", segmentos: segmentarInline(linha.replace(/^[-*•]\s+/, "")) });
      indice += 1;
      continue;
    }

    blocos.push({ tipo: "paragrafo", segmentos: segmentarInline(linha) });
    indice += 1;
  }

  return blocos;
}

/**
 * Blocos para o PDF do resumo: reaproveita analisarBlocos e aplica o que é específico do documento
 * — remove o título duplicado (a capa já mostra) e garante ao menos uma seção. O texto é sanitizado
 * para Latin-1 na hora de desenhar (pdf-resumo.ts), não aqui.
 */
export function analisarBlocosResumo(conteudo: string, titulo: string): BlocoResumo[] {
  const tituloLimpo = limparTitulo(titulo);
  const blocos = analisarBlocos(conteudo).filter(
    (bloco) => !(bloco.tipo === "titulo" && bloco.texto === tituloLimpo),
  );

  if (!blocos.some((bloco) => bloco.tipo === "titulo")) {
    blocos.unshift({ tipo: "titulo", nivel: 2, texto: "Resumo" });
  }

  return blocos;
}
