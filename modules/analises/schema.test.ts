import { describe, expect, it } from "vitest";

import { excluirAnaliseSchema, gerarAnaliseSchema, salvarObservacaoAnaliseSchema } from "./schema";

const CLIENTE = "11111111-1111-4111-8111-111111111111";
const ANALISE = "22222222-2222-4222-8222-222222222222";

/**
 * Estes schemas leem direto de `FormData`, que tem duas formas de dizer "vazio": `null` para campo
 * NÃO ENVIADO e `""` para campo enviado em branco. `.optional()` do Zod aceita só `undefined`, então
 * as duas precisam ser normalizadas.
 *
 * Bug real que motivou o arquivo: gerar análise sem preencher o título devolvia 400 "Dados
 * inválidos" antes de sequer ler o PDF, porque o campo omitido chegava como `null`. É a mesma classe
 * do `lado: ""` em `modules/dor` — daí a cobertura explícita.
 */
describe("gerarAnaliseSchema", () => {
  it("aceita título ausente (FormData devolve null pra campo não enviado)", () => {
    const resultado = gerarAnaliseSchema.safeParse({
      clienteId: CLIENTE,
      tipo: "biorressonancia",
      titulo: null,
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data?.titulo).toBeUndefined();
  });

  it("aceita título em branco e título simplesmente omitido", () => {
    for (const titulo of ["", "   ", undefined]) {
      const resultado = gerarAnaliseSchema.safeParse({
        clienteId: CLIENTE,
        tipo: "exame",
        titulo,
      });

      expect(resultado.success, `titulo=${JSON.stringify(titulo)}`).toBe(true);
      expect(resultado.data?.titulo).toBeUndefined();
    }

    expect(gerarAnaliseSchema.safeParse({ clienteId: CLIENTE, tipo: "exame" }).success).toBe(true);
  });

  it("mantém e apara o título quando informado", () => {
    const resultado = gerarAnaliseSchema.safeParse({
      clienteId: CLIENTE,
      tipo: "exame",
      titulo: "  Hemograma de março  ",
    });

    expect(resultado.data?.titulo).toBe("Hemograma de março");
  });

  it("recusa cliente inválido e tipo fora do vocabulário", () => {
    expect(gerarAnaliseSchema.safeParse({ clienteId: "abc", tipo: "exame" }).success).toBe(false);
    expect(gerarAnaliseSchema.safeParse({ clienteId: CLIENTE, tipo: "raio-x" }).success).toBe(
      false,
    );
  });

  it("recusa título maior que o limite da coluna", () => {
    expect(
      gerarAnaliseSchema.safeParse({ clienteId: CLIENTE, tipo: "exame", titulo: "a".repeat(200) })
        .success,
    ).toBe(false);
  });
});

describe("salvarObservacaoAnaliseSchema", () => {
  it("trata observação nula e vazia como ausente — limpar o campo é válido", () => {
    for (const observacaoProfissional of [null, "", "  "]) {
      const resultado = salvarObservacaoAnaliseSchema.safeParse({
        id: ANALISE,
        clienteId: CLIENTE,
        observacaoProfissional,
      });

      expect(resultado.success).toBe(true);
      expect(resultado.data?.observacaoProfissional).toBeUndefined();
    }
  });

  it("guarda a observação aparada", () => {
    const resultado = salvarObservacaoAnaliseSchema.safeParse({
      id: ANALISE,
      clienteId: CLIENTE,
      observacaoProfissional: "  Confirmei a ferritina baixa.  ",
    });

    expect(resultado.data?.observacaoProfissional).toBe("Confirmei a ferritina baixa.");
  });
});

describe("excluirAnaliseSchema", () => {
  it("só passa com a confirmação explícita", () => {
    const base = { id: ANALISE, clienteId: CLIENTE };

    expect(excluirAnaliseSchema.safeParse({ ...base, confirmarExclusao: "true" }).success).toBe(
      true,
    );
    expect(excluirAnaliseSchema.safeParse(base).success).toBe(false);
    expect(excluirAnaliseSchema.safeParse({ ...base, confirmarExclusao: "false" }).success).toBe(
      false,
    );
  });
});
