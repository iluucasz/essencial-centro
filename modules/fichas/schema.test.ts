import { describe, expect, it } from "vitest";

import { criarFichaEsteticaCorporalSchema, criarFichaExtensaoCiliosSchema } from "./schema";

const base = {
  clienteId: "b1f6f2a0-1c1a-4a9a-9f1a-1c1a4a9a9f1a",
  autorizacaoImagem: false,
  respostas: {
    relato: {
      objetivoTratamento: "Redução de medidas",
      queixaPrincipal: "Gordura localizada no abdômen",
      usaMedicamento: false,
      realizouCirurgia: false,
      gestante: false,
      temAlergia: false,
      aceiteInformacoesVerdadeiras: true,
    },
    avaliacaoProfissional: {
      contraindicacaoImportante: false,
      medidas: {},
    },
    compartilhado: {},
  },
};

describe("criarFichaEsteticaCorporalSchema", () => {
  it("valida uma ficha mínima completa", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse(base);

    expect(resultado.success).toBe(true);
  });

  it("recusa quando não confirma que as informações são verdadeiras", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse({
      ...base,
      respostas: {
        ...base.respostas,
        relato: { ...base.respostas.relato, aceiteInformacoesVerdadeiras: false },
      },
    });

    expect(resultado.success).toBe(false);
  });

  it("exige detalhe do medicamento quando 'usa medicamento' está marcado (campo inteligente)", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse({
      ...base,
      respostas: {
        ...base.respostas,
        relato: { ...base.respostas.relato, usaMedicamento: true },
      },
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const erro = resultado.error.issues.find(
        (i) => i.path.join(".") === "respostas.relato.medicamentoDetalhe",
      );
      expect(erro).toBeTruthy();
    }
  });

  it("aceita 'usa medicamento' quando o detalhe é informado", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse({
      ...base,
      respostas: {
        ...base.respostas,
        relato: {
          ...base.respostas.relato,
          usaMedicamento: true,
          medicamentoDetalhe: "Anticoncepcional, 1x ao dia",
        },
      },
    });

    expect(resultado.success).toBe(true);
  });

  it("exige quantidade de semanas quando gestante está marcado", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse({
      ...base,
      respostas: {
        ...base.respostas,
        relato: { ...base.respostas.relato, gestante: true },
      },
    });

    expect(resultado.success).toBe(false);
  });

  it("exige detalhe da contraindicação quando marcada como importante (alerta à profissional)", () => {
    const resultado = criarFichaEsteticaCorporalSchema.safeParse({
      ...base,
      respostas: {
        ...base.respostas,
        avaliacaoProfissional: { contraindicacaoImportante: true, medidas: {} },
      },
    });

    expect(resultado.success).toBe(false);
  });
});

describe("criarFichaExtensaoCiliosSchema", () => {
  const baseExtensaoCilios = {
    clienteId: "b1f6f2a0-1c1a-4a9a-9f1a-1c1a4a9a9f1a",
    autorizacaoImagem: false,
    respostas: {
      relato: {
        objetivoProcedimento: "Volume russo, efeito natural",
        jaFezExtensaoCilios: true,
        teveReacaoAdesivo: false,
        usaLentesContato: false,
        temProblemaOcular: false,
        temAlergia: false,
        gestanteOuLactante: false,
        realizouCirurgiaOcularRecente: false,
        aceiteInformacoesVerdadeiras: true,
      },
      avaliacaoProfissional: {
        contraindicacaoImportante: false,
      },
      compartilhado: {},
    },
  };

  it("valida uma ficha mínima completa", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse(baseExtensaoCilios);

    expect(resultado.success).toBe(true);
  });

  it("recusa quando não confirma que as informações são verdadeiras", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse({
      ...baseExtensaoCilios,
      respostas: {
        ...baseExtensaoCilios.respostas,
        relato: { ...baseExtensaoCilios.respostas.relato, aceiteInformacoesVerdadeiras: false },
      },
    });

    expect(resultado.success).toBe(false);
  });

  it("exige detalhe da reação quando 'teve reação ao adesivo' está marcado (campo inteligente)", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse({
      ...baseExtensaoCilios,
      respostas: {
        ...baseExtensaoCilios.respostas,
        relato: { ...baseExtensaoCilios.respostas.relato, teveReacaoAdesivo: true },
      },
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const erro = resultado.error.issues.find(
        (i) => i.path.join(".") === "respostas.relato.reacaoAdesivoDetalhe",
      );
      expect(erro).toBeTruthy();
    }
  });

  it("aceita 'teve reação ao adesivo' quando o detalhe é informado", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse({
      ...baseExtensaoCilios,
      respostas: {
        ...baseExtensaoCilios.respostas,
        relato: {
          ...baseExtensaoCilios.respostas.relato,
          teveReacaoAdesivo: true,
          reacaoAdesivoDetalhe: "Vermelhidão leve ao redor dos olhos",
        },
      },
    });

    expect(resultado.success).toBe(true);
  });

  it("exige detalhe quando há problema ocular marcado", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse({
      ...baseExtensaoCilios,
      respostas: {
        ...baseExtensaoCilios.respostas,
        relato: { ...baseExtensaoCilios.respostas.relato, temProblemaOcular: true },
      },
    });

    expect(resultado.success).toBe(false);
  });

  it("exige detalhe da contraindicação quando marcada como importante (alerta à profissional)", () => {
    const resultado = criarFichaExtensaoCiliosSchema.safeParse({
      ...baseExtensaoCilios,
      respostas: {
        ...baseExtensaoCilios.respostas,
        avaliacaoProfissional: { contraindicacaoImportante: true },
      },
    });

    expect(resultado.success).toBe(false);
  });
});
