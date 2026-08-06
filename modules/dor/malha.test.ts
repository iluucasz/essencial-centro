// @vitest-environment node
// Roda fora do jsdom: o GLTFLoader checa `data instanceof ArrayBuffer`, e entre realms (jsdom vs.
// Node) esse teste falha com "Unsupported asset". Nada aqui precisa de DOM.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Box3, Mesh, Raycaster, Vector3, type Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";

import { ancorasDor } from "./ancoras";
import { descreverRegiao, regiaoDoPonto } from "./regioes";

/**
 * Verifica a MALHA publicada em `public/modelos/corpo.glb` e o preparo que `components/corpo-3d.tsx`
 * faz nela. Só a rasterização precisa de GPU — `Box3` e `Raycaster` rodam headless, então dá pra
 * testar de verdade em vez de conferir a olho.
 *
 * Existe porque este ponto já quebrou duas vezes sem nenhum teste reclamar: primeiro por descartar a
 * transformação do nó (corpo 34x menor, invisível), depois por aplicar `applyMatrix4` na geometria
 * quantizada (POSITION é Int16 `normalized`, escrever float trunca tudo — a malha virou um cubo).
 * Nos dois casos os 394 testes passavam, porque nenhum olhava a geometria.
 */

const ALTURA_CANONICA = 100;

/** Passo da varredura em x. Grosso de propósito: sem BVH, cada raio testa os 39k triângulos. */
const PASSO_VARREDURA = 0.1;

/** Altura/largura/profundidade do OBJ de origem, em unidades da malha (SubTool-0). */
const DIMENSOES_ORIGEM = { largura: 25.41, altura: 68.34, profundidade: 11.49 };

let cena: Group;
/** Caixa e derivados calculados UMA vez: `setFromObject` percorre 20k vértices e a varredura de
 * raios chama isso centenas de vezes — recalcular por chamada estoura o timeout do teste. */
let caixa: Box3;
let meioX: number;
let semiX: number;
let alturaCaixa: number;

/** Espelha exatamente o preparo do componente: material/normais, escala canônica e recentragem. */
function prepararCena(raiz: Group) {
  raiz.traverse((no) => {
    if (no instanceof Mesh && !no.geometry.attributes.normal) no.geometry.computeVertexNormals();
  });
  raiz.updateMatrixWorld(true);

  const caixa = new Box3().setFromObject(raiz);
  const alturaOriginal = caixa.max.y - caixa.min.y;
  const fator = alturaOriginal > 0 ? ALTURA_CANONICA / alturaOriginal : 1;

  raiz.scale.setScalar(fator);
  raiz.position.copy(caixa.getCenter(new Vector3()).multiplyScalar(-fator));
  raiz.updateMatrixWorld(true);

  return raiz;
}

beforeAll(async () => {
  const arquivo = readFileSync(join(process.cwd(), "public/modelos/corpo.glb"));
  const buffer = arquivo.buffer.slice(
    arquivo.byteOffset,
    arquivo.byteOffset + arquivo.byteLength,
  ) as ArrayBuffer;

  const gltf = await new Promise<{ scene: Group }>((resolve, reject) => {
    new GLTFLoader().parse(buffer, "", resolve, reject);
  });

  cena = prepararCena(gltf.scene);

  caixa = new Box3().setFromObject(cena);
  meioX = (caixa.min.x + caixa.max.x) / 2;
  semiX = (caixa.max.x - caixa.min.x) / 2;
  alturaCaixa = caixa.max.y - caixa.min.y;
});

describe("corpo.glb — geometria bruta", () => {
  it("mantém as proporções do OBJ de origem depois da simplificação", () => {
    const proporcaoLargura = (caixa.max.x - caixa.min.x) / (caixa.max.y - caixa.min.y);
    const proporcaoProfundidade = (caixa.max.z - caixa.min.z) / (caixa.max.y - caixa.min.y);

    expect(proporcaoLargura).toBeCloseTo(DIMENSOES_ORIGEM.largura / DIMENSOES_ORIGEM.altura, 1);
    expect(proporcaoProfundidade).toBeCloseTo(
      DIMENSOES_ORIGEM.profundidade / DIMENSOES_ORIGEM.altura,
      1,
    );
  });

  it("é um corpo em pé, não um cubo — bem mais alto que largo ou fundo", () => {
    const largura = caixa.max.x - caixa.min.x;
    const altura = caixa.max.y - caixa.min.y;
    const profundidade = caixa.max.z - caixa.min.z;

    expect(altura).toBeGreaterThan(largura * 2);
    expect(altura).toBeGreaterThan(profundidade * 4);
  });

  it("tem triângulos suficientes pra superfície ser clicável, e não tantos que pese", () => {
    let triangulos = 0;

    cena.traverse((no) => {
      if (no instanceof Mesh) {
        const indice = no.geometry.getIndex();
        triangulos += (indice ? indice.count : no.geometry.attributes.position.count) / 3;
      }
    });

    expect(triangulos).toBeGreaterThan(20_000);
    expect(triangulos).toBeLessThan(80_000);
  });
});

describe("preparo da cena — o que o componente faz antes de renderizar", () => {
  it("normaliza pra altura canônica (é o que garante o enquadramento da câmera)", () => {
    expect(caixa.max.y - caixa.min.y).toBeCloseTo(ALTURA_CANONICA, 1);
  });

  it("centra o corpo na origem, que é o alvo do OrbitControls", () => {
    const centro = caixa.getCenter(new Vector3());

    expect(Math.abs(centro.x)).toBeLessThan(1);
    expect(Math.abs(centro.y)).toBeLessThan(1);
    expect(Math.abs(centro.z)).toBeLessThan(1);
  });

  it("fica dentro do campo de visão da câmera configurada", () => {
    const campoVisao = 42;
    const distancia = (ALTURA_CANONICA / 2 / Math.tan((campoVisao / 2) * (Math.PI / 180))) * 1.12;
    const alturaVisivel = 2 * distancia * Math.tan((campoVisao / 2) * (Math.PI / 180));
    const ocupacao = (caixa.max.y - caixa.min.y) / alturaVisivel;

    // Enche a tela sem vazar: foi exatamente o que falhou quando o corpo ficou 34x menor (2,5%).
    expect(ocupacao).toBeGreaterThan(0.7);
    expect(ocupacao).toBeLessThan(1);
  });
});

/** Dispara um raio horizontal na altura pedida e devolve o primeiro toque na superfície. */
function tocar(alturaNormalizada: number, deFrente: boolean, xNormalizado = 0) {
  const y = caixa.min.y + alturaNormalizada * alturaCaixa;
  const x = meioX + xNormalizado * semiX;

  const raio = new Raycaster();
  const direcao = new Vector3(0, 0, deFrente ? -1 : 1);
  raio.set(new Vector3(x, y, deFrente ? ALTURA_CANONICA : -ALTURA_CANONICA), direcao);

  return raio.intersectObject(cena, true)[0] ?? null;
}

describe("raycast na malha — é o que transforma o clique em região", () => {
  /** Varre a largura na altura pedida e conta em quantos x o raio encontra superfície. */
  function largurasQueAcertam(altura: number, deFrente: boolean) {
    const acertos: number[] = [];

    for (let x = -1; x <= 1.0001; x += PASSO_VARREDURA) {
      if (tocar(altura, deFrente, x)) acertos.push(Number(x.toFixed(2)));
    }

    return acertos;
  }

  it("tem superfície alcançável em toda altura do corpo, de frente e de costas", () => {
    // Varre em vez de fixar x por altura: abaixo do quadril o eixo central passa ENTRE as pernas e
    // não toca nada, e as posições exatas mudariam a cada reexportação da malha.
    for (const altura of [0.02, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.78, 0.92]) {
      expect(largurasQueAcertam(altura, true), `frente em h=${altura}`).not.toHaveLength(0);
      expect(largurasQueAcertam(altura, false), `costas em h=${altura}`).not.toHaveLength(0);
    }
  }, 30_000);

  /**
   * O vão entre braço e tronco na cintura é o que `meiaLarguraTronco` usa pra saber onde o tronco
   * acaba. Se uma reexportação mudasse a pose (braços erguidos, por exemplo), o vão desapareceria e
   * o mapa de regiões passaria a gravar "braço" no lugar de "lombar" sem nada acusar.
   */
  it("mantém a pose de braços ao lado do corpo, com vão entre braço e tronco na cintura", () => {
    const acertos = largurasQueAcertam(0.58, true);

    const vaos = acertos.reduce(
      (total, x, i) => (i > 0 && x - acertos[i - 1]! > PASSO_VARREDURA * 1.5 ? total + 1 : total),
      0,
    );

    // Ao menos um vão de cada lado. Não fixa o número exato: os braços são assimétricos na malha
    // (uma mão desce mais que a outra), então uma das laterais rende um vão extra.
    expect(vaos).toBeGreaterThanOrEqual(2);

    // E o tronco tem que estar alcançável dentro do limite que `meiaLarguraTronco` assume (0,62).
    expect(acertos.filter((x) => Math.abs(x) < 0.62).length).toBeGreaterThan(4);
  }, 30_000);

  it("a normal da superfície aponta pra fora — é o que decide peito vs. dorsal", () => {
    const frente = tocar(0.7, true);
    const costas = tocar(0.7, false);

    const normalFrente = frente!
      .face!.normal.clone()
      .transformDirection(frente!.object.matrixWorld);
    const normalCostas = costas!
      .face!.normal.clone()
      .transformDirection(costas!.object.matrixWorld);

    expect(normalFrente.z).toBeGreaterThan(0);
    expect(normalCostas.z).toBeLessThan(0);
  });

  it("um toque no peito vira 'peito' e nas costas na mesma altura vira 'dorsal'", () => {
    const meioX = (caixa.min.x + caixa.max.x) / 2;
    const semiX = (caixa.max.x - caixa.min.x) / 2;

    for (const [deFrente, esperado] of [
      [true, "peito"],
      [false, "dorsal"],
    ] as const) {
      const toque = tocar(0.7, deFrente)!;
      const normal = toque.face!.normal.clone().transformDirection(toque.object.matrixWorld);

      const { regiao } = regiaoDoPonto({
        altura: (toque.point.y - caixa.min.y) / (caixa.max.y - caixa.min.y),
        x: (toque.point.x - meioX) / semiX,
        normalAnterior: normal.z >= 0,
      });

      expect(regiao).toBe(esperado);
    }
  });
});

describe("âncoras clicáveis pousam na malha", () => {
  /**
   * Cada âncora de `ancoras.ts` precisa achar superfície — uma que não acha simplesmente não
   * aparece na tela, e a região fica inalcançável sem nada avisar.
   */
  it.each(
    ancorasDor.map(
      (a) =>
        [`${descreverRegiao(a.regiao, a.lado)} (${a.anterior ? "frente" : "costas"})`, a] as const,
    ),
  )("%s encontra superfície", (_rotulo, ancora) => {
    expect(tocar(ancora.altura, ancora.anterior, ancora.x)).not.toBeNull();
  });
});
