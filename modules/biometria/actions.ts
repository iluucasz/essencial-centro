"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";

import { biometriaCliente } from "./schema";

export async function desativarBiometria(formData: FormData) {
  autorizarPapel(await auth(), ["profissional", "recepcao"]);

  const id = formData.get("id");
  const clienteId = formData.get("clienteId");
  if (typeof id !== "string" || typeof clienteId !== "string") return;

  await db
    .update(biometriaCliente)
    .set({ ativo: false })
    .where(and(eq(biometriaCliente.id, id), eq(biometriaCliente.ativo, true)));

  revalidatePath(`/painel/clientes/${clienteId}`);
}
