import { z } from "zod";

import { TAMANHO_MAXIMO_BYTES, TIPOS_MIME_PERMITIDOS } from "./schema";

export const FOTO_PERFIL_CLIENTE_REGIAO = "__foto_perfil_cliente";

export const fotoPerfilSchema = z.object({
  id: z.string().uuid("Registro inválido."),
  arquivo: z
    .instanceof(File, { message: "Selecione uma imagem." })
    .refine((arquivo) => arquivo.size > 0, "Selecione uma imagem.")
    .refine((arquivo) => arquivo.size <= TAMANHO_MAXIMO_BYTES, "A imagem deve ter até 4MB.")
    .refine(
      (arquivo) => (TIPOS_MIME_PERMITIDOS as readonly string[]).includes(arquivo.type),
      "Formato não suportado: use JPEG, PNG ou WebP.",
    ),
});

export type FotoPerfilInput = z.infer<typeof fotoPerfilSchema>;
