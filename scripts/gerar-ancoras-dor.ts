/**
 * Gera a tabela de âncoras clicáveis de `modules/dor/ancoras.ts` a partir da malha real.
 *
 * Existe porque escolher as coordenadas à mão não funciona: 19 das 24 primeiras âncoras que eu
 * estimei não encontravam superfície nenhuma (ficariam invisíveis na tela). Aqui a superfície é
 * varrida por raycast, cada ponto que acerta é classificado por `regiaoDoPonto`, e cada região fica
 * com um representante central do próprio grupo — coordenada que existe de verdade, por construção.
 *
 * Uso: `pnpm dor:ancoras`. Imprime TypeScript pronto pra colar em `ancoras.ts`.
 */
/* eslint-disable no-console -- script de linha de comando */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Box3, Mesh, Raycaster, Vector3, type Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  descreverRegiao,
  regiaoDoPonto,
  type LadoDor,
  type RegiaoDor,
} from "../modules/dor/regioes.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ALTURA_CANONICA = 100;

/** Passo da varredura: fino o suficiente pra achar dedos e tornozelos. */
const PASSO_ALTURA = 0.01;
const PASSO_X = 0.02;

type Achado = { altura: number; x: number; anterior: boolean };

async function carregarCena(): Promise<Group> {
  const arquivo = readFileSync(join(raiz, "public/modelos/corpo.glb"));
  const buffer = arquivo.buffer.slice(
    arquivo.byteOffset,
    arquivo.byteOffset + arquivo.byteLength,
  ) as ArrayBuffer;

  const gltf = await new Promise<{ scene: Group }>((resolve, reject) => {
    new GLTFLoader().parse(buffer, "", resolve, reject);
  });

  const cena = gltf.scene;
  cena.traverse((no) => {
    if (no instanceof Mesh && !no.geometry.attributes.normal) no.geometry.computeVertexNormals();
  });
  cena.updateMatrixWorld(true);

  const caixa = new Box3().setFromObject(cena);
  const fator = ALTURA_CANONICA / (caixa.max.y - caixa.min.y);
  cena.scale.setScalar(fator);
  cena.position.copy(caixa.getCenter(new Vector3()).multiplyScalar(-fator));
  cena.updateMatrixWorld(true);

  return cena;
}

function mediana(valores: number[]) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);

  return ordenados.length % 2 ? ordenados[meio]! : (ordenados[meio - 1]! + ordenados[meio]!) / 2;
}

async function main() {
  const cena = await carregarCena();
  const caixa = new Box3().setFromObject(cena);
  const meioX = (caixa.min.x + caixa.max.x) / 2;
  const semiX = (caixa.max.x - caixa.min.x) / 2;
  const alturaCaixa = caixa.max.y - caixa.min.y;
  const raio = new Raycaster();

  const grupos = new Map<string, Achado[]>();

  for (let altura = 0; altura <= 1.0001; altura += PASSO_ALTURA) {
    const y = caixa.min.y + altura * alturaCaixa;

    for (const anterior of [true, false]) {
      const direcao = new Vector3(0, 0, anterior ? -1 : 1);

      for (let x = -1; x <= 1.0001; x += PASSO_X) {
        raio.set(
          new Vector3(meioX + x * semiX, y, anterior ? ALTURA_CANONICA : -ALTURA_CANONICA),
          direcao,
        );
        if (!raio.intersectObject(cena, true).length) continue;

        const { regiao, lado } = regiaoDoPonto({ altura, x, normalAnterior: anterior });
        const chave = `${regiao}|${lado ?? ""}|${anterior}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave)!.push({ altura, x, anterior });
      }
    }
  }

  const linhas: string[] = [];

  for (const [chave, achados] of [...grupos].sort()) {
    // Grupos minúsculos são respingo de fronteira, não região clicável.
    if (achados.length < 12) continue;

    const [regiao, lado, anteriorTexto] = chave.split("|") as [RegiaoDor, string, string];
    const anterior = anteriorTexto === "true";

    // Representante central: mediana da altura e, nessa faixa, mediana do x do MESMO sinal — usar a
    // mediana global de x cairia no meio do corpo em regiões que existem dos dois lados.
    const alturaAlvo = mediana(achados.map((a) => a.altura));
    const perto = achados.filter((a) => Math.abs(a.altura - alturaAlvo) < PASSO_ALTURA * 2.5);
    const xAlvo = mediana((perto.length ? perto : achados).map((a) => a.x));

    // Confere que o representante escolhido ainda classifica no mesmo lugar e acerta a malha.
    const conferencia = regiaoDoPonto({ altura: alturaAlvo, x: xAlvo, normalAnterior: anterior });
    raio.set(
      new Vector3(
        meioX + xAlvo * semiX,
        caixa.min.y + alturaAlvo * alturaCaixa,
        anterior ? ALTURA_CANONICA : -ALTURA_CANONICA,
      ),
      new Vector3(0, 0, anterior ? -1 : 1),
    );
    const acerta = raio.intersectObject(cena, true).length > 0;

    const marca =
      conferencia.regiao === regiao && (conferencia.lado ?? "") === lado && acerta ? "  " : "!!";

    linhas.push(
      `${marca}  { regiao: "${regiao}", lado: ${lado ? `"${lado}"` : "null"}, anterior: ${anterior}, altura: ${alturaAlvo.toFixed(3)}, x: ${xAlvo.toFixed(3)} },` +
        `  // ${descreverRegiao(regiao, (lado || null) as LadoDor | null)} · ${achados.length} pontos`,
    );
  }

  console.log(`${linhas.length} âncoras geradas (linhas com "!!" precisam de revisão):\n`);
  for (const linha of linhas) console.log(linha);
}

void main();
