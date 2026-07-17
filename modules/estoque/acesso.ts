import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeGerenciarEstoque(usuario: UsuarioSessao) {
  return usuario.role === "profissional";
}
