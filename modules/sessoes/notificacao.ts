/**
 * Conteúdo da notificação de "sessão registrada" enviada ao cliente (in-app, e-mail e WhatsApp,
 * via `notificarCliente`). Fica separado de `actions.ts` por ser função pura e testável — e
 * porque só pode usar os campos client-facing da sessão (regra de ouro em
 * docs/context/00-produto.md, mesmo corte de `modules/sessoes/acesso.ts`): nunca a avaliação
 * profissional ou observações internas.
 */

/** Link do portal já apontando para a sessão específica, não só a lista — o cliente abre e vê ela. */
export function caminhoPortalSessao(sessaoId: string) {
  return `/portal/sessoes?sessao=${sessaoId}`;
}

export function montarNotificacaoSessaoConcluida(sessao: {
  regiaoTratada: string | null;
  escalaDorAntes: number | null;
  escalaDorDepois: number | null;
  orientacoesPosAtendimento: string | null;
}): { titulo: string; mensagem: string } {
  const partes: string[] = [];

  if (sessao.regiaoTratada) partes.push(`Área tratada: ${sessao.regiaoTratada}.`);

  if (sessao.escalaDorAntes !== null && sessao.escalaDorDepois !== null) {
    partes.push(`Dor antes/depois: ${sessao.escalaDorAntes} → ${sessao.escalaDorDepois}.`);
  }

  if (sessao.orientacoesPosAtendimento?.trim()) {
    partes.push(`Orientações: ${sessao.orientacoesPosAtendimento.trim()}`);
  }

  return {
    titulo: "Sua sessão foi registrada",
    mensagem: partes.length > 0 ? partes.join("\n") : "Confira os detalhes no portal.",
  };
}
