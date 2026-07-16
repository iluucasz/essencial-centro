import { z } from "zod";

export const buscarClientesInputSchema = z.object({
  busca: z
    .string()
    .trim()
    .max(100)
    .optional()
    .describe(
      "Nome ou parte do nome/e-mail. Omitir ou enviar vazio lista os clientes cadastrados mais recentes.",
    ),
});
