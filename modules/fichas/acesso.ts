import type { UsuarioSessao } from "@/modules/auth/rbac";

import type { Ficha } from "./schema";

export type FichaParaCliente = Omit<Ficha, "respostas"> & {
  respostas: { relato: unknown; compartilhado: unknown };
};

/**
 * O cliente só vê o que ele relatou e a área compartilhada — nunca a avaliação/observações
 * internas da profissional (regra de ouro em docs/context/00-produto.md).
 */
export function filtrarFichaParaCliente(ficha: Ficha): FichaParaCliente {
  const respostas = ficha.respostas as Record<string, unknown>;

  return {
    ...ficha,
    respostas: {
      relato: respostas.relato,
      compartilhado: respostas.compartilhado,
    },
  };
}

export function podeGerenciarFichas(usuario: Pick<UsuarioSessao, "role">) {
  return usuario.role === "profissional";
}
