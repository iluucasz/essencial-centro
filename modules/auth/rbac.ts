export const papeisUsuario = ["profissional", "recepcao", "cliente"] as const;

export type PapelUsuario = (typeof papeisUsuario)[number];

export type AreaRestrita = "painel" | "portal";

export type UsuarioSessao = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: PapelUsuario;
  clienteId?: string | null;
  ativo: boolean;
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
  };
}

export function autorizarClienteDono(sessao: SessaoAutorizavel, clienteId: string) {
  const usuario = autorizarPapel(sessao, ["cliente", "profissional", "recepcao"]);

  if (usuario.role === "cliente" && usuario.clienteId !== clienteId) {
    throw new ErroAutorizacao();
  }

  return usuario;
}
