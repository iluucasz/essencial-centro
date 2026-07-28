/**
 * Monta o registro que vai para o prontuário quando a profissional confirma o cliente do PDF
 * anexado. Função pura, separada da action para ser testável sem banco nem sessão.
 *
 * Um único `documento` carrega as duas coisas que a cliente pediu: o **resumo** (em `conteudo`,
 * lido direto na aba Documentos) e o **anexo original** (pela chave do blob). Dois registros
 * separados se perderiam um do outro com o tempo.
 */

const LIMITE_CONTEUDO = 10_000;

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export type EntradaDocumentoBiorressonancia = {
  nomeArquivo: string;
  resumo: string;
  emitidoEm: Date;
};

export function montarTituloBiorressonancia(emitidoEm: Date) {
  return `Biorressonância — ${formatadorData.format(emitidoEm)}`;
}

/**
 * O resumo vem do modelo, então pode vir vazio (falha de geração) ou maior que a coluna aguenta.
 * Nos dois casos o documento ainda precisa existir — o PDF anexado é o registro que importa.
 */
export function montarDocumentoBiorressonancia({
  nomeArquivo,
  resumo,
  emitidoEm,
}: EntradaDocumentoBiorressonancia) {
  const resumoLimpo = resumo.trim();
  const cabecalho = `Arquivo original: ${nomeArquivo}`;
  const corpo = resumoLimpo || "Resumo não gerado — consulte o PDF anexado.";

  return {
    titulo: montarTituloBiorressonancia(emitidoEm),
    conteudo: `${cabecalho}\n\n${corpo}`.slice(0, LIMITE_CONTEUDO),
  };
}
