import { describe, expect, it } from "vitest";

import { filtrarSessaoParaCliente } from "./acesso";
import type { Sessao } from "./schema";

const sessaoCompleta = {
  id: "s1",
  clienteId: "c1",
  servicoId: "sv1",
  profissionalId: "u1",
  agendamentoId: null,
  pacoteId: null,
  dataHora: new Date(),
  duracaoMinutos: 60,
  regiaoTratada: "Abdômen",
  condicaoAntes: "Relatou inchaço",
  relatoCliente: "Sentiu leve desconforto",
  escalaDorAntes: 3,
  escalaDorDepois: 1,
  avaliacaoProfissional: "Boa resposta ao protocolo",
  equipamentosUtilizados: "Radiofrequência",
  parametrosUtilizados: "40W, 20min",
  produtosAplicados: "Gel condutor",
  reacoesObservadas: "Vermelhidão leve, esperada",
  observacoesInternas: "Cliente com pendência financeira no pacote",
  orientacoesPosAtendimento: "Beber bastante água",
  proximaSessaoRecomendada: null,
  presencaConfirmada: true,
  criadoPorId: "u1",
  atualizadoPorId: "u1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
} satisfies Sessao;

describe("filtrarSessaoParaCliente", () => {
  it("remove os campos de avaliação/observação profissional", () => {
    const filtrada = filtrarSessaoParaCliente(sessaoCompleta);

    expect(filtrada.relatoCliente).toBe("Sentiu leve desconforto");
    expect(filtrada.orientacoesPosAtendimento).toBe("Beber bastante água");
    expect("avaliacaoProfissional" in filtrada).toBe(false);
    expect("observacoesInternas" in filtrada).toBe(false);
    expect(JSON.stringify(filtrada)).not.toContain("pendência financeira");
  });
});
