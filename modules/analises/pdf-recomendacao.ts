import type { jsPDF as DocumentoPdf } from "jspdf";

import { LOGO_PDF_BASE64 } from "@/modules/analises/logo-pdf-base64";
import {
  analisarBlocos,
  sanitizarTextoPdf,
  type SegmentoResumo,
} from "@/modules/assistente/conteudo-resumo";

/**
 * PDF da recomendação terapêutica. O layout segue de propósito o modelo em Word que a Edvania já usa
 * hoje (timbre com logo + nome completo da clínica + título + credenciais + nome dela, "Paciente:
 * .../Data: ...", "Queixas:", "Objetivo:", seções em negrito simples sem faixa colorida, aviso legal
 * em itálico, endereço no fim) — não é uma reinterpretação "de app", é o mesmo documento que ela
 * manda hoje, só que com nascimento/peso/altura a mais (pedido dela) e gerado pelo sistema.
 *
 * Ao contrário de `modules/assistente/pdf-resumo.ts` (só download no navegador), este precisa rodar
 * em Server Action também — vai anexado em WhatsApp/e-mail (`modules/analises/actions.ts`) — por isso
 * `montarPdfRecomendacao` só desenha num `jsPDF` já criado, sem `.save()` embutido; quem chama decide
 * se salva no navegador ou serializa em bytes no servidor.
 */

type CorRgb = [number, number, number];

const PAGINA = {
  altura: 297,
  largura: 210,
  margemBaixo: 14,
  margemTopo: 14,
  margemX: 18,
};

/** Mesmos tokens de marca de `app/globals.css` (--brand/--roxo/--dourado), convertidos para RGB. */
const CORES = {
  borda: [222, 200, 150] as CorRgb,
  brand: [20, 91, 72] as CorRgb,
  dourado: [180, 130, 40] as CorRgb,
  douradoClaro: [250, 244, 231] as CorRgb,
  mutado: [90, 90, 90] as CorRgb,
  texto: [20, 20, 20] as CorRgb,
};

/** Nome completo da clínica — texto do timbre que a Edvania já usa hoje, igual ao modelo dela. */
const NOME_COMPLETO_CLINICA = "Essencial Centro de Massoterapia, Ozonioterapia e Estética";
const ENDERECO_CLINICA = "Rua Marcial, nº 80, Juscelino, Mesquita";

const formatadorDataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export type DadosRecomendacaoPdf = {
  clienteNome: string;
  clienteDataNascimento: Date | null;
  clientePeso: number | null;
  clienteAltura: number | null;
  clienteQueixas: string | null;
  clienteObjetivo: string | null;
  profissionalNome: string;
  /**
   * Cargo/título livre da profissional que emite ("Terapeuta Ortomolecular" etc.), cadastrado em
   * `usuario.cargo` (`modules/auth/schema.ts`) — nunca fixo pra qualquer profissional que use o
   * sistema. Aceita múltiplas linhas (uma credencial por linha); ausente, a linha simplesmente não
   * aparece no timbre.
   */
  profissionalCargo?: string | null;
  dataEmissao: Date;
  /** Corpo em markdown simples (##, -, **negrito**) — o mesmo texto salvo em `analiseIa`. */
  conteudo: string;
  /**
   * Prescrição médica de verdade, escrita pela profissional — nunca gerada pela IA. Quando presente,
   * sai numa página própria, com desenho visualmente distinto do resto (pedido dela: "a última parte
   * tem que ser a prescrição, que tem designer diferente").
   */
  prescricaoMedica?: string | null;
};

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

/** Sanitiza sempre antes de medir/quebrar — 1 caractere fora de Latin-1 quebra a linha inteira no jsPDF. */
function quebrarTexto(pdf: DocumentoPdf, texto: string, largura: number) {
  return pdf.splitTextToSize(sanitizarTextoPdf(texto), largura) as string[];
}

function calcularIdade(dataNascimento: Date, referencia: Date) {
  let idade = referencia.getUTCFullYear() - dataNascimento.getUTCFullYear();
  const aindaNaoFezAniversario =
    referencia.getUTCMonth() < dataNascimento.getUTCMonth() ||
    (referencia.getUTCMonth() === dataNascimento.getUTCMonth() &&
      referencia.getUTCDate() < dataNascimento.getUTCDate());

  if (aindaNaoFezAniversario) idade -= 1;

  return idade;
}

function formatarNumero(valor: number) {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace(".", ",");
}

/**
 * Timbre: logo real (a mesma do modelo dela em Word) + nome completo da clínica à esquerda, e
 * título/credenciais/nome da profissional centralizados na coluna à direita do logo — mesma
 * disposição do cabeçalho que ela já usa.
 */
function desenharTimbre(pdf: DocumentoPdf, dados: DadosRecomendacaoPdf) {
  const tamanhoLogo = 22;
  const xColuna = PAGINA.margemX + tamanhoLogo + 6;
  const larguraColuna = PAGINA.largura - PAGINA.margemX - xColuna;
  const centroColuna = xColuna + larguraColuna / 2;

  pdf.addImage(LOGO_PDF_BASE64, "PNG", PAGINA.margemX, PAGINA.margemTopo, tamanhoLogo, tamanhoLogo);

  let y = PAGINA.margemTopo + 4.5;

  aplicarCorTexto(pdf, CORES.brand);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  const linhasNome = quebrarTexto(pdf, NOME_COMPLETO_CLINICA, larguraColuna);
  pdf.text(linhasNome, xColuna, y);
  y += linhasNome.length * 5 + 2.5;

  aplicarCorTexto(pdf, CORES.texto);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("RECOMENDAÇÃO TERAPÊUTICA", centroColuna, y, { align: "center" });
  y += 5.8;

  const linhasCargo = (dados.profissionalCargo ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 4);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const linha of linhasCargo) {
    pdf.text(linha, centroColuna, y, { align: "center" });
    y += 4.4;
  }

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(9.5);
  pdf.text(dados.profissionalNome, centroColuna, y, { align: "center" });

  const alturaLogo = PAGINA.margemTopo + tamanhoLogo;
  // A coluna de texto (nome completo + título + credenciais + nome da profissional) costuma ficar
  // mais alta que o logo — usa o maior dos dois, senão "Paciente:" desenha em cima da última linha.
  return Math.max(alturaLogo, y + 3.5) + 5;
}

/** "Rótulo: valor   Rótulo: valor" numa linha só, negrito no rótulo — devolve o novo `y`. */
function desenharLinhaRotulada(
  pdf: DocumentoPdf,
  pares: Array<[string, string]>,
  yInicial: number,
) {
  pdf.setFontSize(10);
  let x = PAGINA.margemX;

  for (const [rotulo, valor] of pares) {
    pdf.setFont("helvetica", "bold");
    aplicarCorTexto(pdf, CORES.texto);
    pdf.text(rotulo, x, yInicial);
    x += pdf.getTextWidth(rotulo) + 1.5;

    pdf.setFont("helvetica", "normal");
    pdf.text(valor, x, yInicial);
    x += pdf.getTextWidth(valor) + 10;
  }

  return yInicial + 6;
}

/**
 * Dados da paciente em texto corrido, sem cartão colorido — "Paciente: X   Data: Y" igual ao modelo,
 * com nascimento/peso/altura numa segunda linha (pedido novo da Edvania) e Queixas/Objetivo como
 * parágrafos rotulados, também como no modelo.
 */
function desenharDadosCliente(pdf: DocumentoPdf, dados: DadosRecomendacaoPdf, yInicial: number) {
  let y = yInicial;
  const larguraTotal = larguraConteudo();

  function paragrafoRotulado(rotulo: string, valor: string) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    aplicarCorTexto(pdf, CORES.texto);
    pdf.text(rotulo, PAGINA.margemX, y);
    const larguraRotulo = pdf.getTextWidth(rotulo) + 1.5;

    pdf.setFont("helvetica", "normal");
    const linhas = quebrarTexto(pdf, valor, larguraTotal - larguraRotulo);
    pdf.text(linhas[0] ?? "", PAGINA.margemX + larguraRotulo, y);
    y += 5.4;

    for (const linha of linhas.slice(1)) {
      pdf.text(linha, PAGINA.margemX, y);
      y += 5.4;
    }

    y += 2;
  }

  y = desenharLinhaRotulada(
    pdf,
    [
      ["Paciente: ", dados.clienteNome],
      ["Data: ", formatadorDataCurta.format(dados.dataEmissao)],
    ],
    y,
  );

  const medidas: Array<[string, string]> = [];
  if (dados.clienteDataNascimento) {
    const idade = calcularIdade(dados.clienteDataNascimento, dados.dataEmissao);
    medidas.push([
      "Nascimento: ",
      `${formatadorDataCurta.format(dados.clienteDataNascimento)} (${idade} anos)`,
    ]);
  }
  if (dados.clientePeso) medidas.push(["Peso: ", `${formatarNumero(dados.clientePeso)} kg`]);
  if (dados.clienteAltura) medidas.push(["Altura: ", `${formatarNumero(dados.clienteAltura)} cm`]);
  y = desenharLinhaRotulada(pdf, medidas, y);

  y += 1.5;

  if (dados.clienteQueixas?.trim()) paragrafoRotulado("Queixas: ", dados.clienteQueixas.trim());
  if (dados.clienteObjetivo?.trim()) paragrafoRotulado("Objetivo: ", dados.clienteObjetivo.trim());

  return y + 2;
}

type OpcoesTextoRico = {
  segmentos: SegmentoResumo[];
  x: number;
  largura: number;
  tamanho?: number;
  alturaLinha?: number;
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

function criarEscritor(pdf: DocumentoPdf, yInicial: number) {
  let y = yInicial;

  function novaPagina() {
    pdf.addPage();
    y = PAGINA.margemTopo;
  }

  function garantirEspaco(altura: number) {
    if (y + altura <= PAGINA.altura - PAGINA.margemBaixo) return;

    novaPagina();
  }

  function escreverRico({ segmentos, x, largura, tamanho = 10, alturaLinha = 5 }: OpcoesTextoRico) {
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

      aplicarCorTexto(pdf, CORES.texto);
      pdf.text(token.texto, linhaX, y);
      linhaX += larguraToken;
    }

    y += alturaLinha;
  }

  /** Título de seção em negrito simples, sem faixa colorida — igual a "Priorize - reduzir" no modelo. */
  function secao(titulo: string, indice: number) {
    garantirEspaco(indice === 0 ? 7 : 11);
    y += indice === 0 ? 0 : 4;

    aplicarCorTexto(pdf, CORES.texto);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(quebrarTexto(pdf, titulo, larguraConteudo()).slice(0, 1), PAGINA.margemX, y);

    y += 6;
  }

  function paragrafo(segmentos: SegmentoResumo[]) {
    escreverRico({ segmentos, x: PAGINA.margemX, largura: larguraConteudo() });
    y += 1.5;
  }

  function itemLista(segmentos: SegmentoResumo[]) {
    garantirEspaco(5.5);
    aplicarCorTexto(pdf, CORES.texto);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("•", PAGINA.margemX + 1, y);
    escreverRico({ segmentos, x: PAGINA.margemX + 6, largura: larguraConteudo() - 6 });
  }

  return {
    garantirEspaco,
    itemLista,
    paragrafo,
    secao,
    get y() {
      return y;
    },
  };
}

/**
 * Caixa da prescrição médica — só existe quando a profissional escreveu algo (nunca gerado pela
 * IA). Desenho deliberadamente diferente do resto do documento (borda e fundo dourados, título em
 * caixa alta): ela pediu que "a última parte tem que ser a prescrição, que tem designer diferente".
 * Preserva as quebras de linha que ela digitou — cada linha não vazia sai como está, sem reformatar
 * em parágrafo corrido.
 */
function desenharPrescricao(pdf: DocumentoPdf, prescricao: string, yInicial: number) {
  const largura = larguraConteudo();
  const padding = 6;
  const linhas = prescricao
    .split("\n")
    .map((linha) => linha.trim())
    .flatMap((linha) => (linha ? quebrarTexto(pdf, linha, largura - padding * 2) : [""]));

  const alturaTitulo = 12;
  const alturaLinhas = linhas.reduce((soma, linha) => soma + (linha ? 5.2 : 3), 0);
  const altura = alturaTitulo + alturaLinhas + padding;

  aplicarCorPreenchimento(pdf, CORES.douradoClaro);
  aplicarCorBorda(pdf, CORES.dourado);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(PAGINA.margemX, yInicial, largura, altura, 3, 3, "FD");

  let y = yInicial + padding + 3;
  aplicarCorTexto(pdf, CORES.dourado);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.text("PRESCRIÇÃO MÉDICA", PAGINA.margemX + padding, y);
  y += alturaTitulo - 3;

  aplicarCorTexto(pdf, CORES.texto);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  for (const linha of linhas) {
    if (linha) pdf.text(linha, PAGINA.margemX + padding, y);
    y += linha ? 5.2 : 3;
  }

  return yInicial + altura;
}

const TEXTO_AVISO_LEGAL = "Esta recomendação terapêutica não substitui prescrição médica.";

/**
 * Bloco de fechamento: aviso legal (itálico, sem caixa — redação exata pedida por ela, nunca gerada
 * pela IA), linha de assinatura com o nome da profissional e endereço da clínica. A assinatura existe
 * por dois motivos: dá ao documento uma conclusão de verdade (papel/carimbo pedem por onde assinar) e
 * ocupa o espaço que sobrava em branco quando a recomendação é curta.
 */
function desenharBlocoFechamento(pdf: DocumentoPdf, dados: DadosRecomendacaoPdf, yInicial: number) {
  const linhasAviso = quebrarTexto(pdf, TEXTO_AVISO_LEGAL, larguraConteudo());
  let y = yInicial;

  aplicarCorTexto(pdf, CORES.texto);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text(linhasAviso, PAGINA.margemX, y);
  y += linhasAviso.length * 5.2 + 12;

  const larguraAssinatura = 70;
  aplicarCorBorda(pdf, CORES.mutado);
  pdf.setLineWidth(0.3);
  pdf.line(PAGINA.margemX, y, PAGINA.margemX + larguraAssinatura, y);
  y += 5;

  aplicarCorTexto(pdf, CORES.texto);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(dados.profissionalNome, PAGINA.margemX, y);
  y += 4.5;

  aplicarCorTexto(pdf, CORES.mutado);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text("Profissional responsável", PAGINA.margemX, y);
  y += 10;

  aplicarCorTexto(pdf, CORES.mutado);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(`Endereço: ${ENDERECO_CLINICA}.`, PAGINA.largura / 2, y, { align: "center" });

  return y;
}

/** Altura que `desenharBlocoFechamento` consome — precisa saber antes de desenhar pra decidir onde ancorar. */
function alturaBlocoFechamento(pdf: DocumentoPdf) {
  const linhasAviso = quebrarTexto(pdf, TEXTO_AVISO_LEGAL, larguraConteudo());

  return linhasAviso.length * 5.2 + 12 + 5 + 4.5 + 10 + 4;
}

/**
 * Fecha o documento. Sem prescrição: se sobrar bastante espaço na página atual, o bloco de fechamento
 * ancora perto do rodapé (como um rodapé de carta assinada) em vez de ficar largado logo abaixo do
 * conteúdo com uma folha quase em branco por baixo; se não sobrar espaço nenhum, quebra pra nova
 * página. Com prescrição: SEMPRE em página nova, com o timbre repetido — mesmo padrão do modelo em
 * Word dela — e o mesmo ancoramento no rodapé se sobrar espaço nessa página também.
 */
function desenharFechamento(pdf: DocumentoPdf, dados: DadosRecomendacaoPdf, yInicial: number) {
  const prescricao = dados.prescricaoMedica?.trim();
  const alturaBloco = alturaBlocoFechamento(pdf);

  if (prescricao) {
    pdf.addPage();
    const yAposTimbre = desenharTimbre(pdf, dados);
    const yAposPaciente = desenharLinhaRotulada(
      pdf,
      [
        ["Paciente: ", dados.clienteNome],
        ["Data: ", formatadorDataCurta.format(dados.dataEmissao)],
      ],
      yAposTimbre,
    );

    const yAposPrescricao = desenharPrescricao(pdf, prescricao, yAposPaciente + 4);
    const yRodape = PAGINA.altura - PAGINA.margemBaixo - alturaBloco;
    desenharBlocoFechamento(pdf, dados, Math.max(yAposPrescricao + 8, yRodape));
    return;
  }

  const espacoDisponivel = PAGINA.altura - PAGINA.margemBaixo - yInicial;
  let y: number;

  if (espacoDisponivel >= alturaBloco) {
    const yRodape = PAGINA.altura - PAGINA.margemBaixo - alturaBloco;
    y = Math.max(yInicial + 7, yRodape);
  } else {
    pdf.addPage();
    y = PAGINA.margemTopo;
  }

  desenharBlocoFechamento(pdf, dados, y);
}

/** Numeração de página discreta, só quando o documento passa de uma página. */
function adicionarNumeracaoPaginas(pdf: DocumentoPdf) {
  const totalPaginas = pdf.getNumberOfPages();
  if (totalPaginas <= 1) return;

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina);
    aplicarCorTexto(pdf, CORES.mutado);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(`${pagina}/${totalPaginas}`, PAGINA.largura - PAGINA.margemX, PAGINA.altura - 8, {
      align: "right",
    });
  }
}

export function montarPdfRecomendacao(pdf: DocumentoPdf, dados: DadosRecomendacaoPdf) {
  pdf.setProperties({
    author: dados.profissionalNome,
    subject: `Recomendação terapêutica — ${dados.clienteNome}`,
    title: `Recomendação terapêutica — ${dados.clienteNome}`,
  });

  const yAposTimbre = desenharTimbre(pdf, dados);
  const yAposDados = desenharDadosCliente(pdf, dados, yAposTimbre);

  const escritor = criarEscritor(pdf, yAposDados);
  let indiceSecao = 0;

  for (const bloco of analisarBlocos(dados.conteudo)) {
    if (bloco.tipo === "titulo") {
      escritor.secao(bloco.texto, indiceSecao);
      indiceSecao += 1;
    } else if (bloco.tipo === "lista") {
      escritor.itemLista(bloco.segmentos);
    } else if (bloco.tipo === "tabela") {
      // Recomendação não usa tabela na prática (POLITICA_CLINICA pede markdown simples) — cai como
      // texto corrido em vez de silenciosamente sumir, se algum dia o modelo devolver uma.
      escritor.paragrafo([{ texto: bloco.colunas.join(" · "), negrito: true }]);
      for (const linha of bloco.linhas) {
        escritor.paragrafo([{ texto: linha.join(" · "), negrito: false }]);
      }
    } else {
      escritor.paragrafo(bloco.segmentos);
    }
  }

  desenharFechamento(pdf, dados, escritor.y);
  adicionarNumeracaoPaginas(pdf);
}

function nomeArquivoRecomendacao(clienteNome: string, dataEmissao: Date) {
  const nomeSlug = clienteNome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const dataSlug = formatadorDataCurta.format(dataEmissao).replace(/\//g, "-");

  return `Recomendacao-${nomeSlug}-${dataSlug}.pdf`;
}

/** Download no navegador — usado pelo botão "Baixar PDF" no painel. */
export async function baixarPdfRecomendacao(dados: DadosRecomendacaoPdf) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", unit: "mm" });

  montarPdfRecomendacao(pdf, dados);
  pdf.save(nomeArquivoRecomendacao(dados.clienteNome, dados.dataEmissao));
}

/** Bytes do PDF pra anexar em WhatsApp/e-mail a partir de uma Server Action ou rota. */
export async function gerarBufferPdfRecomendacao(dados: DadosRecomendacaoPdf) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ format: "a4", unit: "mm" });

  montarPdfRecomendacao(pdf, dados);

  return {
    buffer: Buffer.from(pdf.output("arraybuffer")),
    nomeArquivo: nomeArquivoRecomendacao(dados.clienteNome, dados.dataEmissao),
  };
}
