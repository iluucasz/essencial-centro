"use client";

import { atualizarFotoPerfilCliente } from "@/modules/fotos/perfil-actions";

import { MenuFotoPerfil } from "./menu-foto-perfil";

export function MenuFotoCliente({
  clienteId,
  clienteNome,
  temFoto,
}: {
  clienteId: string;
  clienteNome: string;
  temFoto: boolean;
}) {
  return (
    <MenuFotoPerfil
      action={atualizarFotoPerfilCliente}
      campoId="clienteId"
      id={clienteId}
      nome={clienteNome}
      rotaVisualizacao={`/api/clientes/${clienteId}/foto-perfil`}
      temFoto={temFoto}
      titulo="Foto do cliente"
    />
  );
}
