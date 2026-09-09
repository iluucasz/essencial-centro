export const papeisUsuario = ["profissional", "recepcao", "cliente"] as const;

export type PapelUsuario = (typeof papeisUsuario)[number];

export const rotulosPapelUsuario: Record<PapelUsuario, string> = {
  profissional: "Profissional",
  recepcao: "Recepção",
  cliente: "Cliente",
};

/**
 * Função é uma camada de permissão ADICIONAL ao papel (profissional/recepção), não uma troca dele —
 * "quero falar de função pra não mexer no cargo do profissional". Só existe pra profissional/recepção
 * (`cliente` fica de fora, `funcao: null`).
 *
 * - `admin`: único que vê Financeiro, Relatórios e Usuários (`autorizarAdmin`). Continua exigindo
 *   `role === "profissional"` — recepção nunca vira admin, mesmo que alguém tente forçar via form.
 * - `manager`: acesso operacional completo (agendar, editar cliente etc.) — igual ao que profissional
 *   e recepção já tinham antes desta função existir.
 * - `reader`: só visualiza. Não cria, edita nem exclui nada (`autorizarEscrita` barra a mutação).
 */
export const funcoesUsuario = ["admin", "manager", "reader"] as const;

export type FuncaoUsuario = (typeof funcoesUsuario)[number];

export const rotulosFuncaoUsuario: Record<FuncaoUsuario, string> = {
  admin: "Admin",
  manager: "Manager",
  reader: "Reader",
};

export function isFuncaoUsuario(value: unknown): value is FuncaoUsuario {
  return typeof value === "string" && funcoesUsuario.includes(value as FuncaoUsuario);
}

/** Papéis que carregam função — `cliente` nunca tem (não navega em nada que função regule). */
export function papelExigeFuncao(papel: PapelUsuario) {
  return papel === "profissional" || papel === "recepcao";
}

export type AreaRestrita = "painel" | "portal";

export type UsuarioSessao = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: PapelUsuario;
  clienteId?: string | null;
  ativo: boolean;
  /** Opcional pra não obrigar todo fixture de teste existente a declarar função — `autorizarPapel`
   * sempre preenche em produção; ausente só significa "não relevante aqui" (ex.: sessão de cliente). */
  funcao?: FuncaoUsuario | null;
};

export type SessaoAutorizavel = {
  user?: Partial<UsuarioSessao> | null;
} | null;

export class ErroAutorizacao extends Error {
  constructor(
    message = "Acesso não autorizado.",
    public readonly status = 403,
  ) {
    super(message);
    this.name = "ErroAutorizacao";
  }
}

export function isPapelUsuario(value: unknown): value is PapelUsuario {
  return typeof value === "string" && papeisUsuario.includes(value as PapelUsuario);
}

export function getDestinoAposLogin(papel: PapelUsuario) {
  return papel === "cliente" ? "/portal" : "/painel";
}

export function podeAcessarArea(papel: PapelUsuario | null | undefined, area: AreaRestrita) {
  if (!papel) return false;

  if (area === "portal") {
    return papel === "cliente";
  }

  return papel === "profissional" || papel === "recepcao";
}

export function autorizarPapel(
  sessao: SessaoAutorizavel,
  papeisPermitidos: readonly PapelUsuario[],
): UsuarioSessao {
  const usuario = sessao?.user;

  if (!usuario?.id || !isPapelUsuario(usuario.role)) {
    throw new ErroAutorizacao("Faça login para continuar.", 401);
  }

  if (usuario.ativo === false) {
    throw new ErroAutorizacao("Usuário inativo.", 403);
  }

  if (!papeisPermitidos.includes(usuario.role)) {
    throw new ErroAutorizacao();
  }

  return {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role,
    clienteId: usuario.clienteId ?? null,
    ativo: usuario.ativo ?? true,
    funcao: isFuncaoUsuario(usuario.funcao) ? usuario.funcao : null,
  };
}

/**
 * Só quem é `profissional` E `funcao === "admin"` passa — usada por Financeiro, Relatórios e
 * Usuários (`docs`: "só ele pode ver questões de relatório, financeiro"). Recepção nunca chega aqui,
 * mesmo com função "admin" salva por engano no banco — o papel é checado antes da função.
 */
export function autorizarAdmin(sessao: SessaoAutorizavel): UsuarioSessao {
  const usuarioAtual = autorizarPapel(sessao, ["profissional"]);

  if (usuarioAtual.funcao !== "admin") {
    throw new ErroAutorizacao();
  }

  return usuarioAtual;
}

/**
 * Mesmo que `autorizarPapel`, mas barra `funcao === "reader"` — reader só visualiza, nunca
 * cria/edita/exclui. Use no lugar de `autorizarPapel` em toda Server Action que MUTA dado (não em
 * queries de leitura). `admin`/`manager` passam normalmente; `null` (cliente, ou registro antigo sem
 * função definida) também passa — reader é a única função que restringe escrita.
 */
export function autorizarEscrita(
  sessao: SessaoAutorizavel,
  papeisPermitidos: readonly PapelUsuario[],
): UsuarioSessao {
  const usuarioAtual = autorizarPapel(sessao, papeisPermitidos);

  if (usuarioAtual.funcao === "reader") {
    throw new ErroAutorizacao(
      "Sua função é somente leitura — fale com um admin para alterar isso.",
    );
  }

  return usuarioAtual;
}

export function autorizarClienteDono(sessao: SessaoAutorizavel, clienteId: string) {
  const usuario = autorizarPapel(sessao, ["cliente", "profissional", "recepcao"]);

  if (usuario.role === "cliente" && usuario.clienteId !== clienteId) {
    throw new ErroAutorizacao();
  }

  return usuario;
}
