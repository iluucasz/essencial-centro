import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const chaveBytes = 64;
type ParametrosScrypt = {
  N: number;
  r: number;
  p: number;
  maxmem: number;
};

const parametros: ParametrosScrypt = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function derivarChave(senha: string, salt: string, opcoes = parametros) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(senha, salt, chaveBytes, opcoes, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function gerarHashSenha(senha: string) {
  const salt = randomBytes(16).toString("base64url");
  const chave = await derivarChave(senha, salt);

  return [
    "scrypt",
    parametros.N,
    parametros.r,
    parametros.p,
    salt,
    chave.toString("base64url"),
  ].join("$");
}

export async function verificarSenha(senha: string, hashArmazenado: string | null | undefined) {
  if (!hashArmazenado) return false;

  const [algoritmo, n, r, p, salt, hash] = hashArmazenado.split("$");
  if (algoritmo !== "scrypt" || !n || !r || !p || !salt || !hash) {
    return false;
  }

  const chaveEsperada = Buffer.from(hash, "base64url");
  if (chaveEsperada.length !== chaveBytes) {
    return false;
  }

  const chaveInformada = await derivarChave(senha, salt, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: parametros.maxmem,
  });

  return timingSafeEqual(chaveEsperada, chaveInformada);
}
