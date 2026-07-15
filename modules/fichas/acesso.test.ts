import { describe, expect, it } from "vitest";

import { filtrarFichaParaCliente } from "./acesso";
import type { Ficha } from "./schema";

const fichaCompleta = {
  id: "f1",
  clienteId: "c1",
  servicoId: null,
  tipo: "estetica_corporal",
  status: "assinada",
  versao: 1,
  versaoAnteriorId: null,
  respostas: {
    relato: { objetivoTratamento: "Redução de medidas" },
    avaliacaoProfissional: {
      observacoesInternas: "Cliente relatou desconforto financeiro para continuar o tratamento",
      diagnosticoEstetico: "Fibrose leve",
    },
    compartilhado: { orientacoes: "Beber bastante água" },
  },
  aceiteTermosEm: new Date(),
  autorizacaoImagemEm: null,
  criadoPorId: "u1",
  atualizadoPorId: "u1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
} as unknown as Ficha;

describe("filtrarFichaParaCliente", () => {
  it("remove a avaliação profissional, mantendo relato e área compartilhada", () => {
    const filtrada = filtrarFichaParaCliente(fichaCompleta);
    const respostas = filtrada.respostas as Record<string, unknown>;

    expect(respostas.relato).toEqual({ objetivoTratamento: "Redução de medidas" });
    expect(respostas.compartilhado).toEqual({ orientacoes: "Beber bastante água" });
    expect(respostas.avaliacaoProfissional).toBeUndefined();
    expect(JSON.stringify(filtrada)).not.toContain("desconforto financeiro");
  });
});
