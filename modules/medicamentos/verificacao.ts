export function precisaVerificacao(verificadoEm: Date | null) {
  return verificadoEm === null;
}

export function contarPendentesVerificacao(medicamentos: { verificadoEm: Date | null }[]) {
  return medicamentos.filter((m) => precisaVerificacao(m.verificadoEm)).length;
}
