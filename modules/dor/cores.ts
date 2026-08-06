/**
 * Cores do mapa de dor como valores literais.
 *
 * É a exceção consciente à regra "só tokens da marca, nunca hex solto" (`docs/context/05-design-system.md`):
 * material de WebGL não aceita classe CSS nem `var()` — o three.js precisa de um número. Os valores
 * abaixo são os MESMOS tokens de `app/globals.css`, copiados aqui só por essa limitação técnica; se a
 * paleta mudar lá, mudar aqui junto.
 */

/**
 * Corpo: a malha é de musculatura, então um tom de tecido lê melhor que o verde `--salvia` chapado
 * que estava antes. Fica dessaturado de propósito — os marcadores de dor precisam saltar por cima.
 */
export const COR_CORPO = 0xc08b7d;
/** Tom mais escuro nas dobras, aplicado por luz de preenchimento fria — dá volume à musculatura. */
export const COR_LUZ_FRIA = 0x7f8fa6;
/** `--lilas` (#b9a3db): âncora clicável que ainda não tem dor registrada. */
export const COR_ANCORA = 0xb9a3db;
/** `--roxo` (#4b2a82): âncora sob o cursor. */
export const COR_ANCORA_ATIVA = 0x4b2a82;

/**
 * Escala de intensidade: verde da marca (sem dor) → amarelo → `--perigo` (#b42318, dor máxima).
 * Interpola em RGB simples; é suficiente porque os três pontos já estão perceptualmente espaçados.
 */
const PARADAS: readonly [number, [number, number, number]][] = [
  [0, [0x14, 0x5b, 0x48]], // --brand, verde profundo
  [5, [0xd9, 0xa2, 0x14]], // âmbar intermediário
  [10, [0xb4, 0x23, 0x18]], // --perigo
];

export function corDaIntensidade(intensidade: number) {
  const valor = Math.min(10, Math.max(0, intensidade));

  let inicio = PARADAS[0]!;
  let fim = PARADAS[PARADAS.length - 1]!;

  for (let i = 0; i < PARADAS.length - 1; i++) {
    if (valor >= PARADAS[i]![0] && valor <= PARADAS[i + 1]![0]) {
      inicio = PARADAS[i]!;
      fim = PARADAS[i + 1]!;
      break;
    }
  }

  const intervalo = fim[0] - inicio[0];
  const t = intervalo === 0 ? 0 : (valor - inicio[0]) / intervalo;

  const canais = inicio[1].map((c, i) => Math.round(c + (fim[1][i]! - c) * t));

  return (canais[0]! << 16) | (canais[1]! << 8) | canais[2]!;
}

/** Mesma escala em CSS, para legenda e listas fora do canvas. */
export function corCssDaIntensidade(intensidade: number) {
  return `#${corDaIntensidade(intensidade).toString(16).padStart(6, "0")}`;
}
