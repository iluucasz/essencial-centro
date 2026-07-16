import type { ResultadoTentativaBiometrica } from "./schema";

/**
 * Limiares mais estritos que o projeto de referência estudado (qualidade mínima 25, FAR máximo
 * 1-em-200) — justificado porque aqui o grupo de candidatos já é pequeno por construção (só quem
 * tem atendimento marcado hoje, nunca a base inteira), e um check-in errado tem consequência maior
 * (consumo de pacote, financeiro) que uma marcação de presença em aula.
 */
export const QUALIDADE_MINIMA_IDENTIFICACAO = 40;
export const FAR_MAXIMO_IDENTIFICACAO = 0.001;
/** O projeto de referência não tinha checagem de ambiguidade nenhuma — só olhava o candidato de
 * índice 0 do resultado do SDK. Esta é a melhoria: exige o 2º colocado ser bem pior que o 1º. */
export const FATOR_SEPARACAO_MINIMA_AMBIGUIDADE = 10;

export type EntradaDecisaoIdentificacao =
  | { situacao: "sem_claim" }
  | { situacao: "claim_invalida" }
  | { situacao: "ja_confirmado" }
  | {
      situacao: "claim_valida";
      qualidade: number;
      farAtingido: number;
      farSegundoColocado: number | null;
    };

function ehAmbiguo(farAtingido: number, farSegundoColocado: number | null): boolean {
  if (farSegundoColocado === null) return false; // ponte não relatou o 2º colocado — checagem pulada, não reprovada
  if (farSegundoColocado <= farAtingido) return true; // 2º colocado igual/melhor que o 1º — sempre ambíguo

  return farSegundoColocado < farAtingido * FATOR_SEPARACAO_MINIMA_AMBIGUIDADE;
}

export function decidirResultadoIdentificacao(
  entrada: EntradaDecisaoIdentificacao,
): ResultadoTentativaBiometrica {
  switch (entrada.situacao) {
    case "sem_claim":
      return "sem_match";
    case "claim_invalida":
      return "rejeitado_invalido";
    case "ja_confirmado":
      return "ja_confirmado";
    case "claim_valida": {
      if (entrada.qualidade < QUALIDADE_MINIMA_IDENTIFICACAO) return "rejeitado_qualidade";
      if (entrada.farAtingido > FAR_MAXIMO_IDENTIFICACAO) return "rejeitado_far";
      if (ehAmbiguo(entrada.farAtingido, entrada.farSegundoColocado)) return "rejeitado_ambiguo";

      return "confirmado";
    }
  }
}
