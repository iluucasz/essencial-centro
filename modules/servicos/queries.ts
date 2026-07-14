import { desc, ilike } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { servico } from "./schema";

export async function listarServicos(busca?: string) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const termo = busca?.trim();

  return db
    .select()
    .from(servico)
    .where(termo ? ilike(servico.nome, `%${termo}%`) : undefined)
    .orderBy(desc(servico.criadoEm));
}
