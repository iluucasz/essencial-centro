import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeGerenciarMedidas(usuario: Pick<UsuarioSessao, "role">) {
  return usuario.role === "profissional";
}
