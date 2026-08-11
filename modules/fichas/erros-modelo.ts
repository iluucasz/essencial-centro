import type { z } from "zod";

/**
 * Traduz os erros do `salvarModeloFichaSchema` numa mensagem que diz O QUE arrumar e ONDE.
 *
 * Existe porque `error.flatten().fieldErrors` só enxerga chaves de primeiro nível: um problema em
 * `campos[21].opcoesImagem` desaparecia, e o construtor mostrava só "Revise os dados do modelo." —
 * com 22 campos na tela, isso não dá pra agir. Aqui o caminho do erro vira "Campo 22 · <título>".
 */
export function descreverErrosDoModelo(
  erro: z.ZodError,
  campos: { rotulo?: string }[] | undefined,
): string {
  const vistos = new Set<string>();
  const linhas: string[] = [];

  for (const problema of erro.issues) {
    const [raiz, indice] = problema.path;

    let onde = "";

    if (raiz === "campos" && typeof indice === "number") {
      // Numeração de 1, igual ao "Campo N" que aparece no construtor.
      const titulo = campos?.[indice]?.rotulo?.trim();
      onde = `Campo ${indice + 1}${titulo ? ` · ${titulo}` : ""}: `;
    } else if (typeof raiz === "string") {
      const rotulos: Record<string, string> = {
        nome: "Nome do modelo",
        descricao: "Descrição",
        campos: "Campos",
      };
      onde = `${rotulos[raiz] ?? raiz}: `;
    }

    const linha = `${onde}${problema.message}`;

    // O mesmo problema pode vir repetido (ex.: uma regra por item da lista).
    if (vistos.has(linha)) continue;
    vistos.add(linha);
    linhas.push(linha);
  }

  if (linhas.length === 0) return "Revise os dados do modelo.";

  // Mais que isso vira parede de texto; o resto aparece depois de corrigir os primeiros.
  const mostradas = linhas.slice(0, 4);
  const restantes = linhas.length - mostradas.length;

  return [
    ...mostradas,
    restantes > 0 ? `…e ${restantes} outro${restantes > 1 ? "s" : ""} ponto a revisar.` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
