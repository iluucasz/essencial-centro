import { NextResponse } from "next/server";

import { dispararMensagensAniversario } from "@/modules/whatsapp/aniversario-job";

/**
 * Disparado pelo cron da Vercel (ver vercel.json) ou por um gatilho externo autenticado.
 * Segurança: mesmo padrão de app/api/cron/lembretes — só o header Authorization com CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const resultado = await dispararMensagensAniversario();

  return NextResponse.json(resultado);
}
