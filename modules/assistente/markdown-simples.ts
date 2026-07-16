export type PedacoMarkdown =
  | { tipo: "texto"; conteudo: string }
  | { tipo: "negrito"; conteudo: string }
  | { tipo: "link"; texto: string; url: string };

const PADRAO_MARKDOWN =
  /\*\*\[([^\]]+)\]\s*\(\s*([^\s)]+)\s*\)\*\*|\[([^\]]+)\]\s*\(\s*([^\s)]+)\s*\)|\*\*([^*]+)\*\*/g;

function limparNegritoDoLink(texto: string) {
  return texto.replace(/^\*\*(.+)\*\*$/, "$1");
}

/**
 * Parser mínimo pro texto do assistente — só **negrito** e [texto](url), o subconjunto que o
 * prompt do sistema instrui o modelo a usar (modules/assistente/prompt.ts). Não é markdown
 * completo de propósito: evita depender de uma lib nova pra um uso tão restrito.
 */
export function analisarMarkdownSimples(texto: string): PedacoMarkdown[] {
  const pedacos: PedacoMarkdown[] = [];
  let ultimoIndice = 0;

  for (const match of texto.matchAll(PADRAO_MARKDOWN)) {
    const indice = match.index;

    if (indice > ultimoIndice) {
      pedacos.push({ tipo: "texto", conteudo: texto.slice(ultimoIndice, indice) });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      pedacos.push({ tipo: "link", texto: limparNegritoDoLink(match[1]), url: match[2] });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      pedacos.push({ tipo: "link", texto: limparNegritoDoLink(match[3]), url: match[4] });
    } else if (match[5] !== undefined) {
      pedacos.push({ tipo: "negrito", conteudo: match[5] });
    }

    ultimoIndice = indice + match[0].length;
  }

  if (ultimoIndice < texto.length) {
    pedacos.push({ tipo: "texto", conteudo: texto.slice(ultimoIndice) });
  }

  return pedacos;
}
