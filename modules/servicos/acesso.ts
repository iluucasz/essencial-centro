import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeGerenciarServicos(usuario: UsuarioSessao) {
  return usuario.role === "profissional";
}
