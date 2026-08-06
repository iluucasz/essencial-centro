"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Mesh, MeshStandardMaterial, Raycaster, Vector3, type Group } from "three";

import { ancorasDaFace, chaveAncora, type Ancora } from "../ancoras";
import { COR_CORPO, COR_LUZ_FRIA, corCssDaIntensidade } from "../cores";
import { descreverRegiao, type LadoDor, type RegiaoDor } from "../regioes";
import { cn } from "@/lib/utils";

const CAMINHO_MALHA = "/modelos/corpo.glb";

/**
 * A cena é reescalada pra esta altura no carregamento, então câmera, marcadores e limites de zoom
 * são todos relativos a ela — trocar o GLB por outro export não desenquadra nada.
 */
const ALTURA_CANONICA = 100;
const CAMPO_VISAO = 42;

/**
 * Distância da câmera. A folga de 45% existe porque o `fov` do three cobre a VERTICAL: num painel
 * largo o corpo encostava em cima e embaixo (parecia cortado), e ainda precisa caber a esfera da
 * âncora, que fica pra fora da pele.
 */
const DISTANCIA_CAMERA =
  (ALTURA_CANONICA / 2 / Math.tan((CAMPO_VISAO / 2) * (Math.PI / 180))) * 1.45;

/** Afastamento do badge em relação à pele, em fração da altura do corpo. */
const RAIO_ANCORA = ALTURA_CANONICA * 0.016;

export type PontoMarcado = {
  id: string;
  regiao: RegiaoDor;
  lado: LadoDor | null;
  intensidade: number;
  anterior: boolean;
  descricao: string;
};

export type AncoraSelecionada = {
  regiao: RegiaoDor;
  lado: LadoDor | null;
  anterior: boolean;
  alturaNormalizada: number;
  xNormalizado: number;
};

type Metricas = { yMin: number; altura: number; meioX: number; semiX: number };

/**
 * Pousa uma âncora na superfície: dispara um raio de fora do corpo, na altura e largura da tabela, e
 * usa o primeiro toque. É o que mantém as esferas coladas na pele — e o que garante que uma
 * coordenada inválida simplesmente não apareça, em vez de flutuar no vazio.
 */
function pousarNaSuperficie(alvo: Group, metricas: Metricas, ancora: Ancora) {
  const y = metricas.yMin + ancora.altura * metricas.altura;
  const x = metricas.meioX + ancora.x * metricas.semiX;
  const zLonge = metricas.altura;

  const raio = new Raycaster();
  const direcao = new Vector3(0, 0, ancora.anterior ? -1 : 1);
  raio.set(new Vector3(x, y, ancora.anterior ? zLonge : -zLonge), direcao);

  const toque = raio.intersectObject(alvo, true)[0]?.point;

  if (!toque) return null;

  // Empurra pra fora pra esfera não afundar na pele.
  return toque.clone().add(direcao.clone().multiplyScalar(-RAIO_ANCORA * 0.55));
}

function Corpo({
  pontos,
  aoSelecionar,
  mostrandoCostas,
  selecionada,
  somenteLeitura,
}: {
  pontos: PontoMarcado[];
  aoSelecionar: (ancora: AncoraSelecionada) => void;
  mostrandoCostas: boolean;
  selecionada: string | null;
  somenteLeitura: boolean;
}) {
  const gltf = useGLTF(CAMINHO_MALHA);
  const [sobre, setSobre] = useState<string | null>(null);

  /**
   * Cena posicionada, sem tocar nos dados da malha.
   *
   * ⚠️ Nunca aplicar `applyMatrix4`/`scale` na BufferGeometry deste GLB: ele é quantizado
   * (`KHR_mesh_quantization`), o atributo POSITION é `Int16` com `normalized: true`, e escrever
   * float de volta nele trunca cada coordenada pra inteiro — a malha colapsa e o corpo vira um cubo.
   * A escala real vem na transformação do nó (`scale: 34.17`), que o three aplica sozinho; aqui só
   * ajustamos escala e posição do OBJETO.
   */
  const cena = useMemo(() => {
    const raiz = gltf.scene.clone(true);
    const pele = new MeshStandardMaterial({ color: COR_CORPO, roughness: 0.75, metalness: 0.05 });

    raiz.traverse((no) => {
      if (!(no instanceof Mesh)) return;

      // O GLB não traz NORMAL (economiza ~1/3 do arquivo). Criar o atributo é seguro — diferente de
      // sobrescrever POSITION, aqui um Float32 novo é adicionado.
      if (!no.geometry.attributes.normal) no.geometry.computeVertexNormals();
      no.material = pele;
    });

    raiz.updateMatrixWorld(true);

    const caixa = new Box3().setFromObject(raiz);
    const alturaOriginal = caixa.max.y - caixa.min.y;
    const fator = alturaOriginal > 0 ? ALTURA_CANONICA / alturaOriginal : 1;

    raiz.scale.setScalar(fator);
    raiz.position.copy(caixa.getCenter(new Vector3()).multiplyScalar(-fator));
    raiz.updateMatrixWorld(true);

    return raiz;
  }, [gltf]);

  const metricas = useMemo<Metricas>(() => {
    const caixa = new Box3().setFromObject(cena);

    return {
      yMin: caixa.min.y,
      altura: caixa.max.y - caixa.min.y,
      meioX: (caixa.min.x + caixa.max.x) / 2,
      semiX: (caixa.max.x - caixa.min.x) / 2,
    };
  }, [cena]);

  /** Estado atual por região+face, pra colorir a âncora de quem já tem dor registrada. */
  const registradoPorAncora = useMemo(() => {
    const mapa = new Map<string, PontoMarcado>();

    // `pontos` chega do mais recente pro mais antigo: o primeiro de cada chave é o estado atual.
    for (const ponto of pontos) {
      const chave = `${chaveAncora(ponto)}:${ponto.anterior}`;
      if (!mapa.has(chave)) mapa.set(chave, ponto);
    }

    return mapa;
  }, [pontos]);

  // Só a face visível: metade das esferas sai da tela e nenhum marcador de costas aparece através do
  // corpo — sem precisar de teste de oclusão por quadro, que com 40 âncoras custaria caro.
  const ancoras = useMemo(
    () =>
      ancorasDaFace(!mostrandoCostas).flatMap((ancora) => {
        const posicao = pousarNaSuperficie(cena, metricas, ancora);

        return posicao ? [{ ancora, posicao }] : [];
      }),
    [cena, metricas, mostrandoCostas],
  );

  return (
    // Gira o corpo inteiro pra mostrar as costas. As âncoras giram junto, então cada uma continua
    // apontando pra sua região — nada de reclassificar por posição.
    <group rotation-y={mostrandoCostas ? Math.PI : 0}>
      <primitive object={cena} />

      {ancoras.map(({ ancora, posicao }) => {
        const registrado = registradoPorAncora.get(ancora.chave);
        const ativa = sobre === ancora.chave || selecionada === ancora.chave;

        return (
          <Html
            center
            key={ancora.chave}
            position={posicao}
            // Contra-rotaciona: sem isso o badge de costas sai espelhado com o grupo girado.
            rotation-y={mostrandoCostas ? -Math.PI : 0}
            zIndexRange={[20, 0]}
          >
            <button
              aria-label={`${ancora.numero}. ${descreverRegiao(ancora.regiao, ancora.lado)}${
                registrado ? ` — dor ${registrado.intensidade} de 10` : ""
              }`}
              className={cn(
                "grid size-7 cursor-pointer place-items-center rounded-full border-2 text-[0.7rem] font-bold shadow-md transition",
                ativa ? "scale-125" : "hover:scale-110",
                registrado
                  ? "border-white/85 text-white"
                  : ativa
                    ? "border-white bg-roxo text-white"
                    : "border-white/80 bg-lilas/95 text-roxo",
              )}
              disabled={somenteLeitura}
              onClick={() => {
                if (somenteLeitura) return;

                aoSelecionar({
                  regiao: ancora.regiao,
                  lado: ancora.lado,
                  anterior: ancora.anterior,
                  alturaNormalizada: ancora.altura,
                  xNormalizado: ancora.x,
                });
              }}
              onPointerOut={() => setSobre((atual) => (atual === ancora.chave ? null : atual))}
              onPointerOver={() => setSobre(ancora.chave)}
              style={
                registrado
                  ? { backgroundColor: corCssDaIntensidade(registrado.intensidade) }
                  : undefined
              }
              type="button"
            >
              {registrado ? registrado.intensidade : ancora.numero}
            </button>
          </Html>
        );
      })}
    </group>
  );
}

/**
 * Modelo 3D do corpo com as âncoras de dor. Carregado por `next/dynamic` (ver `mapa-de-dor.tsx`) pra
 * o three.js não entrar no bundle de quem nunca abre a aba.
 */
export default function Corpo3D({
  pontos,
  aoSelecionar,
  mostrandoCostas,
  selecionada = null,
  somenteLeitura = false,
}: {
  pontos: PontoMarcado[];
  aoSelecionar: (ancora: AncoraSelecionada) => void;
  mostrandoCostas: boolean;
  /** Chave da âncora escolhida no painel, pra destacar a mesma no modelo. */
  selecionada?: string | null;
  somenteLeitura?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, DISTANCIA_CAMERA], fov: CAMPO_VISAO }}
      dpr={[1, 2]}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={0.6} />
      {/* Luz quente de frente e fria por trás: é o que dá relevo à musculatura em vez de chapar. */}
      <directionalLight intensity={1.15} position={[70, 90, 140]} />
      <directionalLight color={COR_LUZ_FRIA} intensity={0.7} position={[-90, 40, -120]} />
      <directionalLight color={COR_LUZ_FRIA} intensity={0.35} position={[0, -80, 60]} />

      <Corpo
        aoSelecionar={aoSelecionar}
        mostrandoCostas={mostrandoCostas}
        pontos={pontos}
        selecionada={selecionada}
        somenteLeitura={somenteLeitura}
      />

      {/* Sem pan e sem inclinar até o extremo: girar e aproximar bastam num tablet. */}
      <OrbitControls
        enablePan={false}
        maxDistance={DISTANCIA_CAMERA * 1.5}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={DISTANCIA_CAMERA * 0.4}
        minPolarAngle={Math.PI * 0.15}
        makeDefault
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

useGLTF.preload(CAMINHO_MALHA);
