/** Personalização tolerante aos dois tokens que as pessoas costumam usar no editor. */
export function personalizarMensagem(conteudo: string, primeiroNome: string): string {
  return conteudo.replace(/\{(?:nome|name)\}/gi, primeiroNome);
}

export type TrechoMensagemWhatsApp = {
  texto: string;
  formato: "texto" | "negrito" | "italico" | "riscado" | "monoespaco";
};

/**
 * Converte os marcadores visuais mais usados pelo WhatsApp em trechos seguros para a prévia.
 * A renderização continua sendo feita por React, sem injetar HTML vindo da mensagem.
 */
export function segmentarMensagemWhatsApp(conteudo: string): TrechoMensagemWhatsApp[] {
  const marcador = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
  const trechos: TrechoMensagemWhatsApp[] = [];
  let inicio = 0;

  for (const ocorrencia of conteudo.matchAll(marcador)) {
    const indice = ocorrencia.index;
    const valor = ocorrencia[0];
    if (indice > inicio) {
      trechos.push({ texto: conteudo.slice(inicio, indice), formato: "texto" });
    }

    const delimitador = valor[0];
    const formato =
      delimitador === "*"
        ? "negrito"
        : delimitador === "_"
          ? "italico"
          : delimitador === "~"
            ? "riscado"
            : "monoespaco";
    trechos.push({ texto: valor.slice(1, -1), formato });
    inicio = indice + valor.length;
  }

  if (inicio < conteudo.length) {
    trechos.push({ texto: conteudo.slice(inicio), formato: "texto" });
  }

  return trechos;
}
