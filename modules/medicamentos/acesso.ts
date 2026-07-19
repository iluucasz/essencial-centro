import type { UsuarioSessao } from "@/modules/auth/rbac";

export function podeGerenciarMedicamentos(usuario: Pick<UsuarioSessao, "role">) {
  return usuario.role === "profissional";
}
