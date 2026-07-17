import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeAlterarFotoPerfilCliente(usuario: UsuarioSessao) {
  return usuario.role === "profissional" || usuario.role === "recepcao";
}

export function podeAlterarFotoUsuario(usuario: UsuarioSessao) {
  return usuario.role === "profissional";
}

export function podeVerFotoUsuario(usuario: UsuarioSessao, usuarioId: string) {
  return usuario.role === "profissional" || usuario.id === usuarioId;
}
