import type { StatusDocumento } from "./schema";

export function podeAssinarDocumento(status: StatusDocumento) {
  return status === "emitido";
}
