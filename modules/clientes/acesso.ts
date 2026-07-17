import { autorizarClienteDono, ErroAutorizacao, type UsuarioSessao } from "@/modules/auth/rbac";

import type { Cliente } from "./schema";

export type ClienteSemInternos = Omit<Cliente, "observacoesInternas">;

export type ClienteVisivel = Cliente | ClienteSemInternos;

export function podeGerenciarClientes(usuario: UsuarioSessao) {
  return usuario.role === "profissional" || usuario.role === "recepcao";
}

export function podeExcluirClientes(usuario: UsuarioSessao) {
  return usuario.role === "profissional";
}

export function removerCamposInternos(cliente: Cliente): ClienteSemInternos {
  const { observacoesInternas: _observacoesInternas, ...clienteSemInternos } = cliente;

  return clienteSemInternos;
}

export function filtrarClienteParaUsuario(
  cliente: Cliente,
  usuario: UsuarioSessao,
): ClienteVisivel {
  if (podeGerenciarClientes(usuario)) {
    return cliente;
  }

  if (usuario.role !== "cliente") {
    throw new ErroAutorizacao();
  }

  autorizarClienteDono({ user: usuario }, cliente.id);

  return removerCamposInternos(cliente);
}
