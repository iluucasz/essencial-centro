const formatadorHorarioPresenca = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatarHorarioPresenca(data: Date) {
  return formatadorHorarioPresenca.format(data);
}
