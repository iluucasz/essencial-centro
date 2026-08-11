/**
 * Detecta violação de índice único do Postgres a partir de um erro capturado num `catch` de insert.
 *
 * O Drizzle (driver `neon-http`) envolve o erro real numa `DrizzleQueryError` cuja `.message` é só
 * "Failed query: ... params: ..." — a mensagem do Postgres (com o nome da constraint) fica em
 * `.cause`, como `NeonDbError` (`.constraint`, `.code === "23505"`). Checar `error.message` direto
 * NUNCA encontra a constraint; é preciso olhar `error.cause`.
 */
export function violaConstraintUnica(error: unknown, nomeConstraint: string): boolean {
  if (!(error instanceof Error)) return false;

  const causa = error.cause;

  if (causa && typeof causa === "object" && "constraint" in causa) {
    return causa.constraint === nomeConstraint;
  }

  // Fallback pra outros drivers/versões onde a mensagem completa já vem no próprio erro.
  return error.message.includes(nomeConstraint);
}
