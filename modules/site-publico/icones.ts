import {
  Flower2,
  Footprints,
  HandHeart,
  Heart,
  Leaf,
  Sparkles,
  Sun,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícones que a profissional pode escolher para cada categoria do catálogo. O banco guarda só o
 * nome (string serializável entre servidor e cliente); o componente é resolvido na exibição.
 */
export const iconesCatalogo = {
  ondas: { rotulo: "Ondas", icone: Waves },
  brilho: { rotulo: "Brilho", icone: Sparkles },
  folha: { rotulo: "Folha", icone: Leaf },
  vento: { rotulo: "Vento", icone: Wind },
  maos: { rotulo: "Mãos", icone: HandHeart },
  flor: { rotulo: "Flor", icone: Flower2 },
  pes: { rotulo: "Pés", icone: Footprints },
  coracao: { rotulo: "Coração", icone: Heart },
  sol: { rotulo: "Sol", icone: Sun },
} satisfies Record<string, { rotulo: string; icone: LucideIcon }>;

export type NomeIcone = keyof typeof iconesCatalogo;
export const nomesIcone = Object.keys(iconesCatalogo) as [NomeIcone, ...NomeIcone[]];

export function nomeDoIcone(icone: LucideIcon): NomeIcone {
  const encontrado = nomesIcone.find((nome) => iconesCatalogo[nome].icone === icone);
  return encontrado ?? "flor";
}
