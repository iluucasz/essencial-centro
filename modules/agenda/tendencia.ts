export type PontoTendencia = { data: string; total: number };

function chaveDia(data: Date) {
  return data.toISOString().slice(0, 10);
}

/** Preenche os últimos `dias` dias (inclusive hoje) com a contagem de agendamentos de cada um. */
export function agruparAgendamentosPorDia(
  agendamentos: { inicio: Date }[],
  dias: number,
  hoje: Date = new Date(),
): PontoTendencia[] {
  const contagem = new Map<string, number>();

  for (const agendamento of agendamentos) {
    const chave = chaveDia(agendamento.inicio);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const pontos: PontoTendencia[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date(hoje);
    data.setUTCDate(data.getUTCDate() - i);
    const chave = chaveDia(data);
    pontos.push({ data: chave, total: contagem.get(chave) ?? 0 });
  }

  return pontos;
}
