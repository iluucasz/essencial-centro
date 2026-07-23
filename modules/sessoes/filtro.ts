export type FiltroPacoteSessao = "sem-pacote" | "todos" | string;
export type FiltroVinculoAgendamentoSessao = "com-agendamento" | "sem-agendamento" | "todos";

export type FiltrosSessoes = {
  busca?: string;
  mesAno?: string;
  pacoteId?: FiltroPacoteSessao;
  servicoId?: "todos" | string;
  vinculoAgendamento?: FiltroVinculoAgendamentoSessao;
};

type SessaoFiltravel = {
  agendamentoId: string | null;
  avaliacaoProfissional?: string | null;
  condicaoAntes?: string | null;
  dataHora: Date | string;
  equipamentosUtilizados?: string | null;
  orientacoesPosAtendimento?: string | null;
  pacoteId: string | null;
  parametrosUtilizados?: string | null;
  produtosAplicados?: string | null;
  reacoesObservadas?: string | null;
  regiaoTratada?: string | null;
  relatoCliente?: string | null;
  servicoId: string;
};

type ContextoBuscaSessao = {
  agendamentoNomePorId?: Map<string, string>;
  pacoteNomePorId?: Map<string, string>;
  servicoNomePorId?: Map<string, string>;
};

function paraData(data: Date | string) {
  return data instanceof Date ? data : new Date(data);
}

function valorMesAno(data: Date | string) {
  const dataNormalizada = paraData(data);
  const mes = String(dataNormalizada.getUTCMonth() + 1).padStart(2, "0");

  return `${dataNormalizada.getUTCFullYear()}-${mes}`;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textoBusca(sessao: SessaoFiltravel, contexto?: ContextoBuscaSessao) {
  return normalizarTexto(
    [
      contexto?.servicoNomePorId?.get(sessao.servicoId),
      sessao.pacoteId ? contexto?.pacoteNomePorId?.get(sessao.pacoteId) : "sessão avulsa",
      sessao.agendamentoId ? contexto?.agendamentoNomePorId?.get(sessao.agendamentoId) : null,
      sessao.regiaoTratada,
      sessao.condicaoAntes,
      sessao.relatoCliente,
      sessao.avaliacaoProfissional,
      sessao.equipamentosUtilizados,
      sessao.parametrosUtilizados,
      sessao.produtosAplicados,
      sessao.reacoesObservadas,
      sessao.orientacoesPosAtendimento,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function ordenarSessoesPorDataDecrescente<TSessao extends SessaoFiltravel>(
  sessoes: TSessao[],
) {
  return [...sessoes].sort(
    (a, b) => paraData(b.dataHora).getTime() - paraData(a.dataHora).getTime(),
  );
}

export function numerarSessoesPorData<TSessao extends SessaoFiltravel & { id: string }>(
  sessoes: TSessao[],
) {
  return new Map(
    [...sessoes]
      .sort((a, b) => paraData(a.dataHora).getTime() - paraData(b.dataHora).getTime())
      .map((sessao, indice) => [sessao.id, indice + 1]),
  );
}

export function filtrarSessoes<TSessao extends SessaoFiltravel>(
  sessoes: TSessao[],
  filtros: FiltrosSessoes,
  contexto?: ContextoBuscaSessao,
) {
  const termo = normalizarTexto(filtros.busca?.trim() ?? "");
  const mesAno = filtros.mesAno ?? "";
  const servicoId = filtros.servicoId ?? "todos";
  const pacoteId = filtros.pacoteId ?? "todos";
  const vinculoAgendamento = filtros.vinculoAgendamento ?? "todos";

  return sessoes.filter((sessao) => {
    const passaBusca = termo === "" || textoBusca(sessao, contexto).includes(termo);
    const passaMesAno = mesAno === "" || valorMesAno(sessao.dataHora) === mesAno;
    const passaServico = servicoId === "todos" || sessao.servicoId === servicoId;
    const passaPacote =
      pacoteId === "todos" ||
      (pacoteId === "sem-pacote" ? sessao.pacoteId === null : sessao.pacoteId === pacoteId);
    const passaVinculo =
      vinculoAgendamento === "todos" ||
      (vinculoAgendamento === "com-agendamento"
        ? sessao.agendamentoId !== null
        : sessao.agendamentoId === null);

    return passaBusca && passaMesAno && passaServico && passaPacote && passaVinculo;
  });
}
