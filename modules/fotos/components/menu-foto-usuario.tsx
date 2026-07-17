"use client";

import { atualizarFotoUsuario } from "@/modules/fotos/perfil-actions";

import { MenuFotoPerfil } from "./menu-foto-perfil";

export function MenuFotoUsuario({
  temFoto,
  usuarioId,
  usuarioNome,
}: {
  temFoto: boolean;
  usuarioId: string;
  usuarioNome: string;
}) {
  return (
    <MenuFotoPerfil
      action={atualizarFotoUsuario}
      campoId="usuarioId"
      id={usuarioId}
      nome={usuarioNome}
      rotaVisualizacao={`/api/usuarios/${usuarioId}/foto`}
      tamanho="sm"
      temFoto={temFoto}
      titulo="Foto do usuário"
    />
  );
}
