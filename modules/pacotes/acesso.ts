import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeEditarPacotes(usuario: UsuarioSessao) {
  return usuario.role === "profissional" || usuario.role === "recepcao";
}

export function podeExcluirPacotes(usuario: UsuarioSessao) {
  return usuario.role === "profissional";
}
