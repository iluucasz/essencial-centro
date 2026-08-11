import { randomInt } from "node:crypto";

/**
 * Senha provisória que a clínica dita ao cliente por WhatsApp ou no balcão. Ela é lida em voz alta e
 * digitada à mão, então o alfabeto tira tudo que se confunde nessa passagem: `0`/`O`, `1`/`l`/`I`,
 * `5`/`S`, `2`/`Z`. Sem símbolos pelo mesmo motivo — "arroba", "cerquilha" viram erro de digitação.
 *
 * A força vem do tamanho, não da variedade: 10 caracteres em um alfabeto de 49 dão ~56 bits, e a
 * senha vive poucos minutos — na primeira entrada o `deveTrocarSenha` obriga a pessoa a definir a
 * dela (`definirPrimeiraSenha`).
 */
const ALFABETO_SEM_AMBIGUIDADE = "ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtuvwxy34679";

export const TAMANHO_SENHA_PROVISORIA = 10;

/**
 * `randomInt` em vez de `Math.random`: é CSPRNG e sem viés de módulo (rejeita e re-sorteia). Uma
 * senha previsível aqui abriria a conta de um cliente com dado clínico dentro.
 */
export function gerarSenhaProvisoria(tamanho = TAMANHO_SENHA_PROVISORIA): string {
  let senha = "";

  for (let i = 0; i < tamanho; i += 1) {
    senha += ALFABETO_SEM_AMBIGUIDADE[randomInt(ALFABETO_SEM_AMBIGUIDADE.length)];
  }

  return senha;
}

/** Exposto só pro teste conferir que nenhum caractere ambíguo entrou no alfabeto. */
export const CARACTERES_AMBIGUOS = "0O1lI5S2Z8";
