export type IntervaloAgendamento = {
  inicio: Date;
  duracaoMinutos: number;
};

function fimDoIntervalo(intervalo: IntervaloAgendamento) {
  return new Date(intervalo.inicio.getTime() + intervalo.duracaoMinutos * 60_000);
}

/** Dois intervalos se sobrepõem quando um começa antes do outro terminar, nos dois sentidos. */
export function intervalosSobrepoem(a: IntervaloAgendamento, b: IntervaloAgendamento) {
  return a.inicio < fimDoIntervalo(b) && b.inicio < fimDoIntervalo(a);
}

export function encontrarConflito(novo: IntervaloAgendamento, existentes: IntervaloAgendamento[]) {
  return existentes.find((existente) => intervalosSobrepoem(novo, existente)) ?? null;
}
