import { describe, expect, it } from "vitest";

import { filtrarSessoes, numerarSessoesPorData, ordenarSessoesPorDataDecrescente } from "./filtro";

const sessoes = [
  {
    id: "sessao-1",
    agendamentoId: "agendamento-1",
    dataHora: new Date("2026-07-21T20:00:00.000Z"),
    pacoteId: "pacote-1",
    regiaoTratada: "Rosto",
    relatoCliente: "Cliente relatou menos dor",
    servicoId: "servico-crio",
  },
  {
    id: "sessao-2",
    agendamentoId: null,
    dataHora: new Date("2026-08-03T14:00:00.000Z"),
    pacoteId: null,
    regiaoTratada: "Abdômen",
    relatoCliente: "Sessão avulsa de manutenção",
    servicoId: "servico-drenagem",
  },
  {
    id: "sessao-3",
    agendamentoId: "agendamento-3",
    dataHora: new Date("2026-08-10T10:00:00.000Z"),
    pacoteId: "pacote-2",
    regiaoTratada: "Pernas",
    relatoCliente: "Boa resposta ao protocolo",
    servicoId: "servico-crio",
  },
];

describe("filtrarSessoes", () => {
  it("filtra por busca textual usando nomes de serviço, pacote e textos clínicos", () => {
    const filtradas = filtrarSessoes(
      sessoes,
      { busca: "criofrequencia" },
      {
        pacoteNomePorId: new Map([["pacote-1", "Pacote rosto"]]),
        servicoNomePorId: new Map([
          ["servico-crio", "Criofrequência"],
          ["servico-drenagem", "Drenagem"],
        ]),
      },
    );

    expect(filtradas.map((sessao) => sessao.id)).toEqual(["sessao-1", "sessao-3"]);
  });

  it("combina filtros de mês, pacote, serviço e vínculo com atendimento", () => {
    const filtradas = filtrarSessoes(sessoes, {
      mesAno: "2026-08",
      pacoteId: "sem-pacote",
      servicoId: "servico-drenagem",
      vinculoAgendamento: "sem-agendamento",
    });

    expect(filtradas.map((sessao) => sessao.id)).toEqual(["sessao-2"]);
  });
});

describe("ordenação e numeração de sessões", () => {
  it("ordena do registro mais recente para o mais antigo e numera pela ordem cronológica", () => {
    expect(ordenarSessoesPorDataDecrescente(sessoes).map((sessao) => sessao.id)).toEqual([
      "sessao-3",
      "sessao-2",
      "sessao-1",
    ]);
    expect([...numerarSessoesPorData(sessoes).entries()]).toEqual([
      ["sessao-1", 1],
      ["sessao-2", 2],
      ["sessao-3", 3],
    ]);
  });
});
