import { regiaoDoPonto, type LadoDor, type RegiaoDor } from "./regioes";

/**
 * Pontos fixos e clicáveis do corpo — a interação principal do mapa de dor.
 *
 * Por que âncoras em vez de clique livre: clicar em qualquer lugar exige converter coordenada em
 * região a cada toque, e um erro de 2cm troca "lombar" por "glúteo" sem ninguém perceber. Com um
 * conjunto fixo, cada âncora **já carrega** a sua região — o toque é uma escolha entre opções
 * nomeadas, não uma medição. Também fica muito melhor no dedo, num tablet.
 *
 * As coordenadas estão no espaço normalizado de `regioes.ts` (`altura` 0 = planta do pé, 1 = topo da
 * cabeça; `x` −1..1). O componente pousa cada âncora na superfície por raycast, então elas
 * acompanham a malha. `ancoras.test.ts` garante que cada uma classifica na região que declara — se
 * uma coordenada sair da faixa, o teste falha em vez de gravar dado errado.
 */
export type Ancora = {
  regiao: RegiaoDor;
  lado: LadoDor | null;
  /** Face do corpo em que a âncora aparece. */
  anterior: boolean;
  altura: number;
  x: number;
};

/**
 * Tabela GERADA por `pnpm dor:ancoras` (scripts/gerar-ancoras-dor.ts), que varre a superfície da
 * malha por raycast e escolhe um representante central de cada região. Não editar as coordenadas à
 * mão: as primeiras que estimei "no olho" deixaram 19 de 24 âncoras fora da malha, invisíveis na
 * tela. Ao trocar o GLB, rode o script de novo e cole a saída.
 *
 * Membros aparecem nas DUAS faces de propósito — dor na frente da coxa e atrás dela são coisas
 * diferentes, e `anterior` fica gravado no registro. Regiões de linha média ficam só na face em que
 * fazem sentido (peito na frente, lombar nas costas).
 */
export const ancorasDor: Ancora[] = [
  // ---- Frente ----
  { regiao: "cabeca", lado: null, anterior: true, altura: 0.93, x: 0 },
  { regiao: "peito", lado: null, anterior: true, altura: 0.71, x: -0.02 },
  { regiao: "abdomen", lado: null, anterior: true, altura: 0.58, x: 0 },
  { regiao: "quadril", lado: null, anterior: true, altura: 0.5, x: -0.04 },
  { regiao: "ombro", lado: "direito", anterior: true, altura: 0.77, x: -0.61 },
  { regiao: "ombro", lado: "esquerdo", anterior: true, altura: 0.76, x: 0.54 },
  { regiao: "braco", lado: "direito", anterior: true, altura: 0.655, x: -0.82 },
  { regiao: "braco", lado: "esquerdo", anterior: true, altura: 0.66, x: 0.8 },
  { regiao: "antebraco", lado: "direito", anterior: true, altura: 0.55, x: -0.91 },
  { regiao: "antebraco", lado: "esquerdo", anterior: true, altura: 0.54, x: 0.9 },
  { regiao: "mao", lado: "esquerdo", anterior: true, altura: 0.45, x: 0.92 },
  { regiao: "coxa", lado: "direito", anterior: true, altura: 0.39, x: -0.32 },
  { regiao: "coxa", lado: "esquerdo", anterior: true, altura: 0.39, x: 0.3 },
  { regiao: "joelho", lado: "direito", anterior: true, altura: 0.28, x: -0.32 },
  { regiao: "joelho", lado: "esquerdo", anterior: true, altura: 0.29, x: 0.34 },
  { regiao: "panturrilha", lado: "direito", anterior: true, altura: 0.185, x: -0.36 },
  { regiao: "panturrilha", lado: "esquerdo", anterior: true, altura: 0.17, x: 0.36 },
  { regiao: "tornozelo", lado: "direito", anterior: true, altura: 0.07, x: -0.36 },
  { regiao: "tornozelo", lado: "esquerdo", anterior: true, altura: 0.07, x: 0.36 },
  { regiao: "pe", lado: "direito", anterior: true, altura: 0.02, x: -0.4 },
  { regiao: "pe", lado: "esquerdo", anterior: true, altura: 0.02, x: 0.4 },

  // ---- Costas ----
  { regiao: "cervical", lado: null, anterior: false, altura: 0.82, x: -0.02 },
  { regiao: "dorsal", lado: null, anterior: false, altura: 0.71, x: -0.02 },
  { regiao: "lombar", lado: null, anterior: false, altura: 0.58, x: 0 },
  { regiao: "ombro", lado: "direito", anterior: false, altura: 0.76, x: 0.54 },
  { regiao: "ombro", lado: "esquerdo", anterior: false, altura: 0.77, x: -0.61 },
  { regiao: "braco", lado: "direito", anterior: false, altura: 0.66, x: 0.8 },
  { regiao: "braco", lado: "esquerdo", anterior: false, altura: 0.655, x: -0.82 },
  { regiao: "antebraco", lado: "direito", anterior: false, altura: 0.54, x: 0.9 },
  { regiao: "antebraco", lado: "esquerdo", anterior: false, altura: 0.55, x: -0.91 },
  { regiao: "mao", lado: "direito", anterior: false, altura: 0.45, x: 0.92 },
  { regiao: "gluteo", lado: "direito", anterior: false, altura: 0.5, x: 0.22 },
  { regiao: "gluteo", lado: "esquerdo", anterior: false, altura: 0.5, x: -0.24 },
  { regiao: "coxa", lado: "direito", anterior: false, altura: 0.39, x: 0.3 },
  { regiao: "coxa", lado: "esquerdo", anterior: false, altura: 0.39, x: -0.32 },
  { regiao: "joelho", lado: "direito", anterior: false, altura: 0.29, x: 0.34 },
  { regiao: "joelho", lado: "esquerdo", anterior: false, altura: 0.28, x: -0.32 },
  { regiao: "panturrilha", lado: "direito", anterior: false, altura: 0.17, x: 0.36 },
  { regiao: "panturrilha", lado: "esquerdo", anterior: false, altura: 0.185, x: -0.36 },
  { regiao: "tornozelo", lado: "direito", anterior: false, altura: 0.07, x: 0.36 },
  { regiao: "tornozelo", lado: "esquerdo", anterior: false, altura: 0.07, x: -0.36 },
];

/** Chave estável de uma âncora — também é a chave usada pra casar com os registros do banco. */
export function chaveAncora(ancora: Pick<Ancora, "regiao" | "lado">) {
  return `${ancora.regiao}:${ancora.lado ?? ""}`;
}

export type AncoraNumerada = Ancora & { numero: number; chave: string };

/**
 * Âncoras de UMA face, numeradas de cima pra baixo (e da direita do paciente pra esquerda no empate).
 *
 * Mostrar só a face visível resolve duas coisas de uma vez: tira metade das esferas da tela e evita
 * marcador de costas aparecendo através do corpo — sem precisar de teste de oclusão a cada quadro,
 * que com 40 âncoras custaria caro. O número é o mesmo no modelo e na legenda ao lado.
 */
export function ancorasDaFace(anterior: boolean): AncoraNumerada[] {
  return ancorasDor
    .filter((ancora) => ancora.anterior === anterior)
    .sort((a, b) => b.altura - a.altura || a.x - b.x)
    .map((ancora, indice) => ({
      ...ancora,
      numero: indice + 1,
      chave: `${chaveAncora(ancora)}:${ancora.anterior}`,
    }));
}

/** Confere se a âncora cai mesmo na região que declara (usado pelo teste). */
export function ancoraClassificaCorreto(ancora: Ancora) {
  const { regiao, lado } = regiaoDoPonto({
    altura: ancora.altura,
    x: ancora.x,
    normalAnterior: ancora.anterior,
  });

  return regiao === ancora.regiao && lado === ancora.lado;
}
