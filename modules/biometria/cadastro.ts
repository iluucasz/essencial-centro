/** O projeto de referência capturava a qualidade do cadastro mas nunca rejeitava com base nela —
 * cadastros ruins sempre eram salvos. Esta é a correção: exigir qualidade mínima no cadastro.
 * Valor calibrado contra o leitor físico real: nesta leitora, um dedo bem colocado produz ~8-10
 * de qualidade (a referência nunca serviu de base aqui, já que ela não tinha limiar nenhum). */
export const QUALIDADE_MINIMA_CADASTRO = 5;

export function qualidadeCadastroValida(qualidade: number): boolean {
  return qualidade >= QUALIDADE_MINIMA_CADASTRO;
}
