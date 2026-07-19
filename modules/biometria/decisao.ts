import type { ResultadoTentativaBiometrica } from "./schema";

/**
 * Qualidade calibrada empiricamente contra o leitor físico real (não veio do projeto de
 * referência — a Enroll/Verify dela nunca checava qualidade nenhuma, então o MinIdentifyQuality=25
 * de lá não servia de base real). Nesta leitora, um dedo bem colocado produz ~8-10 de qualidade;
 * o limiar fica abaixo disso, com uma margem pequena, pra não rejeitar leituras normais.
 */
export const QUALIDADE_MINIMA_IDENTIFICACAO = 4;
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
      // qualidade === 0 não é "leitura ruim" — é o SDK Futronic não reportando o valor pra esse
      // tipo de captura (confirmado com dado real: um match perfeito, farAtingido=0, veio com
      // qualidade=0). A própria ponte trata 0 como "não medido" antes de sequer tentar o match
      // (FutronicBiometric.Identify, mesma regra usada no app de referência) — o servidor precisa
      // da mesma exceção, senão rejeita matches corretos só por causa de um metadado ausente.
      if (entrada.qualidade > 0 && entrada.qualidade < QUALIDADE_MINIMA_IDENTIFICACAO) {
        return "rejeitado_qualidade";
      }
      if (entrada.farAtingido > FAR_MAXIMO_IDENTIFICACAO) return "rejeitado_far";
      if (ehAmbiguo(entrada.farAtingido, entrada.farSegundoColocado)) return "rejeitado_ambiguo";

      return "confirmado";
    }
  }
}
