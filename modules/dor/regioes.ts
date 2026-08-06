/**
 * Vocabulário anatômico do mapa de dor e a conversão de um ponto da malha 3D para região nomeada.
 *
 * Por que existe: a malha (`modules/3D/SubTool-0`, export cru do ZBrush) **não tem rótulo nenhum** —
 * um único grupo `Group21968`, sem UV nem material. Um clique nela devolve coordenada, e coordenada
 * não vira gráfico de evolução nem relatório. Aqui o corpo é normalizado num espaço canônico
 * (`altura` 0 = planta do pé, 1 = topo da cabeça) e as regiões são faixas nesse espaço — assim o
 * clique sai como `{ regiao, lado }` comparável entre sessões, igual ao par `regiao`+`lado` que
 * `modules/medidas` já usa.
 *
 * Tudo aqui é função pura de propósito: a correção anatômica é testável no Vitest, sem GPU nem
 * banco (`regioes.test.ts`), e a conferência visual está em `scripts/verificar-regioes-dor.ts`.
 */

export const regioesDor = [
  "cabeca",
  "cervical",
  "ombro",
  "braco",
  "antebraco",
  "mao",
  "peito",
  "abdomen",
  "dorsal",
  "lombar",
  "quadril",
  "gluteo",
  "coxa",
  "joelho",
  "panturrilha",
  "tornozelo",
  "pe",
] as const;

export type RegiaoDor = (typeof regioesDor)[number];

export const rotulosRegiaoDor: Record<RegiaoDor, string> = {
  cabeca: "Cabeça",
  cervical: "Cervical (nuca)",
  ombro: "Ombro",
  braco: "Braço",
  antebraco: "Antebraço",
  mao: "Mão",
  peito: "Peito",
  abdomen: "Abdômen",
  dorsal: "Costas (dorsal)",
  lombar: "Lombar",
  quadril: "Quadril",
  gluteo: "Glúteo",
  coxa: "Coxa",
  joelho: "Joelho",
  panturrilha: "Panturrilha",
  tornozelo: "Tornozelo",
  pe: "Pé",
} satisfies Record<RegiaoDor, string>;

/** Regiões que existem dos dois lados do corpo — exigem `lado`, como em `modules/medidas`. */
export const regioesBilateraisDor = [
  "ombro",
  "braco",
  "antebraco",
  "mao",
  "gluteo",
  "coxa",
  "joelho",
  "panturrilha",
  "tornozelo",
  "pe",
] as const satisfies readonly RegiaoDor[];

export const ladosDor = ["direito", "esquerdo"] as const;

export type LadoDor = (typeof ladosDor)[number];

export const rotulosLadoDor: Record<LadoDor, string> = {
  direito: "Direito",
  esquerdo: "Esquerdo",
};

export function regiaoEhBilateral(regiao: RegiaoDor) {
  return (regioesBilateraisDor as readonly RegiaoDor[]).includes(regiao);
}

/** Rótulo completo pra UI e relatório: "Ombro direito", "Lombar". */
export function descreverRegiao(regiao: RegiaoDor, lado: LadoDor | null) {
  if (!regiaoEhBilateral(regiao) || !lado) return rotulosRegiaoDor[regiao];

  return `${rotulosRegiaoDor[regiao]} ${lado}`;
}

/**
 * Ponto clicado, já normalizado pelo visualizador:
 * - `altura`: 0 na planta do pé, 1 no topo da cabeça.
 * - `x`: −1 na borda esquerda da malha, +1 na direita (referencial de quem OLHA o modelo).
 * - `normalAnterior`: normal da superfície aponta pra frente do corpo. Vem do raycast (`normal.z`),
 *   que é exato — não dá pra deduzir frente/costas só da posição, porque o centro em Z do corpo
 *   muda a cada altura (glúteo −3,3 vs. tórax −2,5 nas unidades originais da malha).
 */
export type PontoMalha = {
  altura: number;
  x: number;
  normalAnterior: boolean;
};

/**
 * Meia-largura do TRONCO em `x` normalizado, por altura. Os braços caem ao lado do corpo e ocupam
 * as mesmas alturas do tronco, então altura sozinha não separa "lombar" de "braço".
 *
 * Os valores saem de medição na própria malha (histograma de |x| por faixa, ver
 * `scripts/verificar-regioes-dor.ts`). Lembrando que `x` é normalizado pela meia-largura GLOBAL, que
 * as mãos definem na altura do quadril — por isso os limites são bem menores que 1: na altura do
 * ombro o corpo só alcança |x|≈0,79, e na cintura o tronco termina em |x|≈0,39 com o braço
 * retomando só em ~0,70 (há um vão vazio entre os dois).
 */
function meiaLarguraTronco(altura: number) {
  if (altura >= 0.87) return 1; // cabeça: os braços não chegam aqui
  if (altura >= 0.72) return 0.42; // cervical/ombro: separa nuca e trapézio do deltoide
  if (altura >= 0.63) return 0.52; // tórax: o braço encosta, vão estreito (0,52–0,85)
  if (altura >= 0.32) return 0.62; // cintura até coxa alta: tronco mais largo, vão em 0,62–0,75
  return 1; // abaixo da coxa alta as mãos já terminaram
}

/** Faixas de altura do MEMBRO SUPERIOR — usadas só quando o ponto está fora do tronco. */
function regiaoMembroSuperior(altura: number): RegiaoDor {
  if (altura >= 0.72) return "ombro";
  if (altura >= 0.6) return "braco";
  if (altura >= 0.48) return "antebraco";

  return "mao";
}

/** Faixas de altura do TRONCO e do membro inferior; `anterior` decide peito/dorsal e abdômen/lombar. */
function regiaoEixoCentral(altura: number, anterior: boolean): RegiaoDor {
  if (altura >= 0.87) return "cabeca";
  if (altura >= 0.8) return "cervical";
  if (altura >= 0.63) return anterior ? "peito" : "dorsal";
  if (altura >= 0.54) return anterior ? "abdomen" : "lombar";
  if (altura >= 0.46) return anterior ? "quadril" : "gluteo";
  if (altura >= 0.32) return "coxa";
  if (altura >= 0.25) return "joelho";
  if (altura >= 0.1) return "panturrilha";
  if (altura >= 0.04) return "tornozelo";

  return "pe";
}

/**
 * `x` é o referencial de quem olha o modelo; região clínica é o lado DO PACIENTE. De frente para o
 * modelo, a direita dele fica à nossa esquerda — por isso o eixo inverte conforme a face observada.
 */
function ladoDoPaciente(x: number, anterior: boolean): LadoDor {
  const paraDireita = anterior ? x < 0 : x > 0;

  return paraDireita ? "direito" : "esquerdo";
}

export type RegiaoIdentificada = { regiao: RegiaoDor; lado: LadoDor | null };

/** Converte um ponto da malha na região anatômica nomeada que vai pro banco. */
export function regiaoDoPonto({ altura, x, normalAnterior }: PontoMalha): RegiaoIdentificada {
  const alturaLimitada = Math.min(1, Math.max(0, altura));

  const regiao =
    Math.abs(x) > meiaLarguraTronco(alturaLimitada)
      ? regiaoMembroSuperior(alturaLimitada)
      : regiaoEixoCentral(alturaLimitada, normalAnterior);

  return {
    regiao,
    lado: regiaoEhBilateral(regiao) ? ladoDoPaciente(x, normalAnterior) : null,
  };
}

export const INTENSIDADE_MINIMA = 0;
export const INTENSIDADE_MAXIMA = 10;

/**
 * Faixas da Escala Visual Analógica de dor — o mesmo 0–10 que `sessao.escalaDorAntes/Depois` já
 * usa, aqui só nomeado pra cor e leitura na UI.
 */
export function faixaIntensidade(intensidade: number) {
  if (intensidade === 0) return { chave: "sem_dor", rotulo: "Sem dor" } as const;
  if (intensidade <= 3) return { chave: "leve", rotulo: "Leve" } as const;
  if (intensidade <= 6) return { chave: "moderada", rotulo: "Moderada" } as const;
  if (intensidade <= 9) return { chave: "intensa", rotulo: "Intensa" } as const;

  return { chave: "maxima", rotulo: "Pior dor imaginável" } as const;
}
