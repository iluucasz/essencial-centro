/**
 * Conferência VISUAL do mapa de regiões do módulo de dor (`modules/dor/regioes.ts`).
 *
 * Existe porque a malha do corpo é um export cru do ZBrush sem rótulo anatômico algum: as fronteiras
 * das regiões são números calibrados à mão, e número errado aqui não quebra teste nenhum — só grava
 * "lombar" onde a profissional clicou no glúteo. Este script projeta os vértices da malha em duas
 * imagens (frente e costas) pintando cada região com uma cor, para conferir a anatomia a olho.
 *
 * Uso: `pnpm dor:regioes [pasta-de-saida]` (padrão: a pasta do sistema). Também imprime o
 * histograma de |x| por faixa de altura, que é de onde saem os limites de `meiaLarguraTronco`.
 */
/* eslint-disable no-console -- script de linha de comando */
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

import { regiaoDoPonto, regioesDor, type RegiaoDor } from "../modules/dor/regioes.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const MALHA = join(raiz, "modules/3D/SubTool-0-8302662.OBJ");

const LARGURA = 210;
const ALTURA_IMG = 470;
/** Fatias de altura usadas pra achar o centro em Z local — o corpo não é centrado em Z. */
const FATIAS = 60;

const cores: Record<RegiaoDor, [number, number, number]> = {
  cabeca: [230, 60, 60],
  cervical: [255, 140, 0],
  ombro: [250, 210, 40],
  braco: [130, 200, 50],
  antebraco: [40, 170, 90],
  mao: [0, 190, 190],
  peito: [60, 120, 240],
  abdomen: [140, 90, 230],
  dorsal: [60, 120, 240],
  lombar: [140, 90, 230],
  quadril: [235, 100, 180],
  gluteo: [235, 100, 180],
  coxa: [160, 110, 60],
  joelho: [90, 90, 90],
  panturrilha: [30, 60, 150],
  tornozelo: [205, 200, 150],
  pe: [20, 20, 20],
};

/** PNG RGB de 8 bits sem dependência externa (zlib já vem no Node). */
function png(largura: number, altura: number, rgb: Buffer) {
  const cru = Buffer.alloc((largura * 3 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    cru[y * (largura * 3 + 1)] = 0; // filtro "none"
    rgb.copy(cru, y * (largura * 3 + 1) + 1, y * largura * 3, (y + 1) * largura * 3);
  }

  const tabela: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  const crc = (b: Buffer) => {
    let c = 0xffffffff;
    for (const x of b) c = tabela[(c ^ x) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const bloco = (tipo: string, dados: Buffer) => {
    const t = Buffer.from(tipo, "ascii");
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(dados.length);
    const soma = Buffer.alloc(4);
    soma.writeUInt32BE(crc(Buffer.concat([t, dados])));
    return Buffer.concat([tam, t, dados, soma]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(cru)),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}

async function lerVertices() {
  const linhas = createInterface({ input: createReadStream(MALHA), crlfDelay: Infinity });
  const pontos: [number, number, number][] = [];

  for await (const linha of linhas) {
    if (!linha.startsWith("v ")) continue;
    const p = linha.split(/\s+/);
    pontos.push([Number(p[1]), Number(p[2]), Number(p[3])]);
  }

  return pontos;
}

async function main() {
  const saida = process.argv[2] ?? tmpdir();
  const pontos = await lerVertices();

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const [x, y] of pontos) {
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  const alturaTotal = yMax - yMin;
  const meioX = (xMin + xMax) / 2;
  const semiX = (xMax - xMin) / 2;
  const alturaDe = (y: number) => (y - yMin) / alturaTotal;

  // Centro em Z por fatia de altura: é o que separa frente de costas de forma anatômica.
  const somaZ = new Array<number>(FATIAS).fill(0);
  const contaZ = new Array<number>(FATIAS).fill(0);
  for (const [, y, z] of pontos) {
    const i = Math.min(FATIAS - 1, Math.floor(alturaDe(y) * FATIAS));
    somaZ[i]! += z;
    contaZ[i]! += 1;
  }
  const centroZ = somaZ.map((s, i) => (contaZ[i] ? s / contaZ[i]! : 0));

  const contagem = Object.fromEntries(regioesDor.map((r) => [r, 0])) as Record<RegiaoDor, number>;

  for (const [nome, anterior] of [
    ["frente", true],
    ["costas", false],
  ] as const) {
    const buffer = Buffer.alloc(LARGURA * ALTURA_IMG * 3, 255);

    for (const [px, py, pz] of pontos) {
      const altura = alturaDe(py);
      const fatia = Math.min(FATIAS - 1, Math.floor(altura * FATIAS));
      if (pz > centroZ[fatia]! !== anterior) continue;

      const x = (px - meioX) / semiX;
      const { regiao } = regiaoDoPonto({ altura, x, normalAnterior: anterior });
      contagem[regiao] += 1;

      // Espelha a vista de costas: as duas se leem como o corpo girando no próprio eixo.
      const desenhoX = anterior ? x : -x;
      const u = Math.round(((desenhoX + 1) / 2) * (LARGURA - 1));
      const v = Math.round((1 - altura) * (ALTURA_IMG - 1));
      if (u < 0 || u >= LARGURA || v < 0 || v >= ALTURA_IMG) continue;

      const cor = cores[regiao];
      const i = (v * LARGURA + u) * 3;
      buffer[i] = cor[0];
      buffer[i + 1] = cor[1];
      buffer[i + 2] = cor[2];
    }

    writeFileSync(join(saida, `regioes-dor-${nome}.png`), png(LARGURA, ALTURA_IMG, buffer));
  }

  console.log("pontos por região (as duas vistas somadas):");
  for (const regiao of regioesDor) {
    console.log(`  ${regiao.padEnd(12)} ${contagem[regiao]}`);
  }

  console.log("\nhistograma de |x| por faixa de altura (de onde saem os limites do tronco):");
  for (const [rotulo, a, b] of [
    ["cervical  0.84", 0.83, 0.86],
    ["ombro     0.78", 0.77, 0.8],
    ["tórax     0.70", 0.69, 0.72],
    ["cintura   0.60", 0.59, 0.62],
    ["quadril   0.50", 0.49, 0.52],
    ["coxa alta 0.44", 0.43, 0.46],
  ] as const) {
    const bins = new Array<number>(20).fill(0);
    for (const [px, py] of pontos) {
      const altura = alturaDe(py);
      if (altura < a || altura >= b) continue;
      const x = Math.abs((px - meioX) / semiX);
      bins[Math.min(19, Math.floor(x * 20))]! += 1;
    }
    const barra = bins
      .map((c) => (c === 0 ? "·" : c < 20 ? "▁" : c < 80 ? "▃" : c < 200 ? "▅" : "█"))
      .join("");
    console.log(`  ${rotulo}  |x| 0→1: ${barra}`);
  }

  console.log(`\nimagens em ${saida}`);
}

void main();
