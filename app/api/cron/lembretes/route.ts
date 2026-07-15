import { NextResponse } from "next/server";

import { dispararLembretes } from "@/modules/agenda/lembretes-job";

/**
 * Disparado pelo cron da Vercel (ver vercel.json) ou por um gatilho externo autenticado.
 * Segurança: só o header Authorization com CRON_SECRET — padrão documentado pela Vercel
 * (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const resultado = await dispararLembretes();

  return NextResponse.json(resultado);
}
