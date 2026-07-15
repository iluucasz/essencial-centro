import type { StatusAgendamento } from "./schema";

export function podeConfirmarPresenca(status: StatusAgendamento, checkinEm: Date | null) {
  return status === "marcado" && checkinEm === null;
}
