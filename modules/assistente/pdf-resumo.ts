import type { jsPDF as DocumentoPdf } from "jspdf";

import {
  analisarBlocosResumo,
  extrairNomeClienteResumo,
  sanitizarTextoPdf,
  type SegmentoResumo,
} from "@/modules/assistente/conteudo-resumo";
import type { DocumentoResumoPdf } from "@/modules/assistente/documentos-resumo";

type CorRgb = [number, number, number];

const PAGINA = {
  altura: 297,
  largura: 210,
  margemBaixo: 18,
  margemTopo: 16,
  margemX: 16,
};

const CORES = {
  alerta: [216, 151, 41] as CorRgb,
  alertaClaro: [252, 244, 228] as CorRgb,
  borda: [225, 216, 210] as CorRgb,
  brand: [21, 98, 78] as CorRgb,
  brandClaro: [232, 243, 239] as CorRgb,
  brandEscuro: [15, 78, 62] as CorRgb,
  fundo: [250, 248, 245] as CorRgb,
  lilasClaro: [244, 239, 250] as CorRgb,
  mutado: [108, 117, 114] as CorRgb,
  roxo: [91, 55, 143] as CorRgb,
  superficie: [255, 255, 255] as CorRgb,
  texto: [34, 45, 43] as CorRgb,
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function aplicarCorTexto(pdf: DocumentoPdf, cor: CorRgb) {
  pdf.setTextColor(cor[0], cor[1], cor[2]);
}

function aplicarCorPreenchimento(pdf: DocumentoPdf, cor: CorRgb) {
  pdf.setFillColor(cor[0], cor[1], cor[2]);
}

function aplicarCorBorda(pdf: DocumentoPdf, cor: CorRgb) {
  pdf.setDrawColor(cor[0], cor[1], cor[2]);
}

function larguraConteudo() {
  return PAGINA.largura - PAGINA.margemX * 2;
}

/** Sanitiza sempre antes de medir/quebrar — garante que o jsPDF nunca receba caractere fora de Latin-1. */
function quebrarTexto(pdf: DocumentoPdf, texto: string, largura: number) {
  return pdf.splitTextToSize(sanitizarTextoPdf(texto), largura) as string[];
}

function tituloPedeAlerta(texto: string) {
  const normalizado = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    normalizado.includes("atencao") ||
    normalizado.includes("alerta") ||
    normalizado.includes("seguranca") ||
    normalizado.includes("limitacao") ||
    normalizado.includes("observacao")
  );
}

function desenharFundo(pdf: DocumentoPdf) {
  aplicarCorPreenchimento(pdf, CORES.fundo);
  pdf.rect(0, 0, PAGINA.largura, PAGINA.altura, "F");
}

function desenharCapa(pdf: DocumentoPdf, documento: DocumentoResumoPdf) {
  desenharFundo(pdf);

  aplicarCorPreenchimento(pdf, CORES.brand);
  pdf.roundedRect(PAGINA.margemX, 16, larguraConteudo(), 45, 6, 6, "F");

  aplicarCorTexto(pdf, CORES.superficie);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("RELATÓRIO GERADO PELO ASSISTENTE", PAGINA.margemX + 8, 27);

  const nomeCliente = extrairNomeClienteResumo(documento.conteudo) ?? "Resumo do documento";
  pdf.setFontSize(nomeCliente.length > 26 ? 16 : 21);
  pdf.text(
    quebrarTexto(pdf, nomeCliente, larguraConteudo() - 16).slice(0, 1),
    PAGINA.margemX + 8,
    40,
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const linhasArquivo = quebrarTexto(
    pdf,
    `Arquivo original: ${documento.nomeArquivo}`,
    larguraConteudo() - 16,
  );
  pdf.text(linhasArquivo.slice(0, 2), PAGINA.margemX + 8, 51);
}

function desenharAviso(pdf: DocumentoPdf, y: number) {
  aplicarCorPreenchimento(pdf, CORES.alertaClaro);
  aplicarCorBorda(pdf, CORES.alerta);
  pdf.roundedRect(PAGINA.margemX, y, larguraConteudo(), 22, 5, 5, "FD");

  aplicarCorTexto(pdf, CORES.texto);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.text("Nota de uso", PAGINA.margemX + 7, y + 8);

  aplicarCorTexto(pdf, CORES.mutado);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  const linhas = quebrarTexto(
    pdf,
    "Resumo de apoio para leitura profissional. Não constitui diagnóstico, prescrição ou substituição da avaliação clínica.",
    larguraConteudo() - 14,
  );
  pdf.text(linhas, PAGINA.margemX + 7, y + 15);
}

type OpcoesTextoRico = {
  segmentos: SegmentoResumo[];
  x: number;
  largura: number;
  tamanho?: number;
  alturaLinha?: number;
  cor?: CorRgb;
  corNegrito?: CorRgb;
};

type TokenRico = { texto: string; negrito: boolean; espaco: boolean };

function tokensDeSegmentos(segmentos: SegmentoResumo[]): TokenRico[] {
  const tokens: TokenRico[] = [];

  for (const segmento of segmentos) {
    for (const parte of sanitizarTextoPdf(segmento.texto).split(/(\s+)/)) {
      if (parte === "") continue;

      tokens.push({ texto: parte, negrito: segmento.negrito, espaco: /^\s+$/.test(parte) });
    }
  }

  return tokens;
}

/**
 * Escreve segmentos com negrito inline, quebrando por palavra e medindo a largura real de cada
 * palavra na fonte certa. É o que faz "**Cliente:** Katia" sair com o rótulo em negrito na mesma
 * linha do valor, em vez de perder o negrito ou grudar tudo.
 */
function criarEscritor(pdf: DocumentoPdf) {
  let y = 94;
  let indiceBanda = 0;
  let contadorSecao = 0;
  let corSecaoAtual = CORES.brand;

  function novaPagina() {
    pdf.addPage();
    desenharFundo(pdf);
    y = PAGINA.margemTopo;
  }

  function garantirEspaco(altura: number) {
    if (y + altura <= PAGINA.altura - PAGINA.margemBaixo) return;

    novaPagina();
  }

  function escreverRico({
    segmentos,
    x,
    largura,
    tamanho = 9.5,
    alturaLinha = 5.2,
    cor = CORES.texto,
    corNegrito = CORES.brandEscuro,
  }: OpcoesTextoRico) {
    const tokens = tokensDeSegmentos(segmentos);

    pdf.setFontSize(tamanho);
    pdf.setFont("helvetica", "normal");
    const larguraEspaco = pdf.getTextWidth(" ");

    garantirEspaco(alturaLinha);
    let linhaX = x;

    for (const token of tokens) {
      if (token.espaco) {
        if (linhaX > x) linhaX += larguraEspaco;
        continue;
      }

      pdf.setFont("helvetica", token.negrito ? "bold" : "normal");
      const larguraToken = pdf.getTextWidth(token.texto);

      if (linhaX > x && linhaX + larguraToken > x + largura) {
        y += alturaLinha;
        garantirEspaco(alturaLinha);
        linhaX = x;
      }

      aplicarCorTexto(pdf, token.negrito ? corNegrito : cor);
      pdf.text(token.texto, linhaX, y);
      linhaX += larguraToken;
    }

    y += alturaLinha;
  }

  function secao(titulo: string, numerada: boolean) {
    indiceBanda += 1;
    const numero = numerada ? (contadorSecao += 1) : null;
    corSecaoAtual = tituloPedeAlerta(titulo)
      ? CORES.alerta
      : indiceBanda % 2 === 0
        ? CORES.roxo
        : CORES.brand;

    const espacoAntes = indiceBanda === 1 ? 0 : 4;

    garantirEspaco(12 + espacoAntes);
    y += espacoAntes;

    aplicarCorPreenchimento(pdf, corSecaoAtual);
    pdf.roundedRect(PAGINA.margemX, y, larguraConteudo(), 12, 4, 4, "F");

    const xTitulo = numero === null ? PAGINA.margemX + 8 : PAGINA.margemX + 16;

    if (numero !== null) {
      aplicarCorPreenchimento(pdf, CORES.superficie);
      pdf.circle(PAGINA.margemX + 8, y + 6, 4, "F");
      aplicarCorTexto(pdf, corSecaoAtual);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(String(numero), PAGINA.margemX + 8, y + 6, { align: "center", baseline: "middle" });
    }

    aplicarCorTexto(pdf, CORES.superficie);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(
      quebrarTexto(pdf, titulo, larguraConteudo() - (xTitulo - PAGINA.margemX) - 8).slice(0, 1),
      xTitulo,
      y + 6,
      { baseline: "middle" },
    );
    // Gap generoso entre a faixa e o conteúdo — sem isso o título fica "grudado" na 1ª linha.
    y += 21;
  }

  function subtitulo(titulo: string) {
    y += 3;
    garantirEspaco(13);
    aplicarCorPreenchimento(pdf, CORES.lilasClaro);
    aplicarCorBorda(pdf, CORES.borda);
    pdf.roundedRect(PAGINA.margemX, y, larguraConteudo(), 10, 4, 4, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    aplicarCorTexto(pdf, CORES.roxo);
    pdf.text(
      quebrarTexto(pdf, titulo, larguraConteudo() - 12).slice(0, 1),
      PAGINA.margemX + 6,
      y + 5,
      { baseline: "middle" },
    );
    y += 16;
  }

  function paragrafo(segmentos: SegmentoResumo[]) {
    escreverRico({ segmentos, x: PAGINA.margemX, largura: larguraConteudo() });
    y += 2;
  }

  function itemLista(segmentos: SegmentoResumo[]) {
    garantirEspaco(6);
    aplicarCorPreenchimento(pdf, corSecaoAtual);
    pdf.circle(PAGINA.margemX + 2.4, y - 1.4, 1.3, "F");
    escreverRico({
      segmentos,
      x: PAGINA.margemX + 7,
      largura: larguraConteudo() - 7,
    });
    y += 1.6;
  }

  function tabela(colunas: string[], linhas: string[][]) {
    const totalColunas = Math.max(1, colunas.length);
    const larguraColuna = larguraConteudo() / totalColunas;
    const padding = 2.2;

    function desenharFileira(celulas: string[], cabecalho: boolean) {
      const preenchidas = Array.from(
        { length: totalColunas },
        (_, indice) => celulas[indice] ?? "",
      );
      const linhasPorCelula = preenchidas.map((celula) =>
        quebrarTexto(pdf, celula, larguraColuna - padding * 2),
      );
      const maxLinhas = Math.max(1, ...linhasPorCelula.map((linhas) => linhas.length));
      const altura = maxLinhas * 4.4 + 4;

      garantirEspaco(altura);

      aplicarCorPreenchimento(pdf, cabecalho ? corSecaoAtual : CORES.superficie);
      aplicarCorBorda(pdf, CORES.borda);
      pdf.rect(PAGINA.margemX, y, larguraConteudo(), altura, "FD");

      pdf.setFont("helvetica", cabecalho ? "bold" : "normal");
      pdf.setFontSize(8.4);
      aplicarCorTexto(pdf, cabecalho ? CORES.superficie : CORES.texto);

      linhasPorCelula.forEach((linhasCelula, indice) => {
        const xCelula = PAGINA.margemX + indice * larguraColuna + padding;

        linhasCelula.forEach((linha, indiceLinha) => {
          pdf.text(linha, xCelula, y + 4 + indiceLinha * 4.4);
        });

        if (indice > 0) {
          aplicarCorBorda(pdf, CORES.borda);
          pdf.line(
            PAGINA.margemX + indice * larguraColuna,
            y,
            PAGINA.margemX + indice * larguraColuna,
            y + altura,
          );
        }
      });

      y += altura;
    }

    garantirEspaco(14);
    desenharFileira(colunas, true);

    for (const linha of linhas) {
      desenharFileira(linha, false);
    }

    y += 3;
  }

  return { itemLista, paragrafo, secao, subtitulo, tabela };
}

function adicionarRodapes(pdf: DocumentoPdf) {
  const totalPaginas = pdf.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina);

    aplicarCorTexto(pdf, CORES.mutado);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Essencial Centro", PAGINA.margemX, PAGINA.altura - 10);
    pdf.text(`${pagina}/${totalPaginas}`, PAGINA.largura - PAGINA.margemX - 8, PAGINA.altura - 10);
  }
}

export function montarPdfResumo(pdf: DocumentoPdf, documento: DocumentoResumoPdf) {
  pdf.setProperties({
    author: "Essencial Centro",
    subject: `Resumo gerado a partir do PDF ${documento.nomeArquivo}`,
    title: documento.titulo,
  });

  desenharCapa(pdf, documento);
  desenharAviso(pdf, 66);

  const escritor = criarEscritor(pdf);

  escritor.subtitulo(`Gerado em ${formatadorDataHora.format(new Date())}`);

  for (const bloco of analisarBlocosResumo(documento.conteudo, documento.titulo)) {
    if (bloco.tipo === "titulo") {
      if (bloco.nivel === 1) escritor.secao(bloco.texto, false);
      else if (bloco.nivel === 2) escritor.secao(bloco.texto, true);
      else escritor.subtitulo(bloco.texto);
    } else if (bloco.tipo === "lista") {
      escritor.itemLista(bloco.segmentos);
    } else if (bloco.tipo === "tabela") {
      escritor.tabela(bloco.colunas, bloco.linhas);
    } else {
      escritor.paragrafo(bloco.segmentos);
    }
  }

  adicionarRodapes(pdf);
}

export async function baixarDocumentoResumoPdf(documento: DocumentoResumoPdf) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", unit: "mm" });

  montarPdfResumo(pdf, documento);
  pdf.save(documento.nomeDownload);
}
