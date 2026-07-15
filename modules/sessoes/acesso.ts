import type { Sessao } from "./schema";

export type SessaoParaCliente = Omit<
  Sessao,
  | "avaliacaoProfissional"
  | "equipamentosUtilizados"
  | "parametrosUtilizados"
  | "produtosAplicados"
  | "reacoesObservadas"
  | "observacoesInternas"
>;

/**
 * O cliente vê o próprio relato e a área compartilhada, nunca a avaliação/observações internas
 * da profissional (regra de ouro em docs/context/00-produto.md).
 */
export function filtrarSessaoParaCliente(sessao: Sessao): SessaoParaCliente {
  const {
    avaliacaoProfissional: _avaliacaoProfissional,
    equipamentosUtilizados: _equipamentosUtilizados,
    parametrosUtilizados: _parametrosUtilizados,
    produtosAplicados: _produtosAplicados,
    reacoesObservadas: _reacoesObservadas,
    observacoesInternas: _observacoesInternas,
    ...sessaoParaCliente
  } = sessao;

  return sessaoParaCliente;
}
