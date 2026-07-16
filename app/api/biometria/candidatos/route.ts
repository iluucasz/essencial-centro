import { NextResponse } from "next/server";

import { autorizarSegredoBridge } from "@/modules/biometria/bridge";
import { obterCandidatosDeHoje } from "@/modules/biometria/queries";

/**
 * Pool de candidatos pra ponte física rodar o FTRIdentify localmente — só quem tem atendimento
 * marcado hoje e ainda não fez check-in. Sugestão: a ponte busca isso a cada poucos minutos e
 * reconstrói sua galeria local, já que agendamentos são criados/cancelados/confirmados o dia todo.
 */
export async function GET(request: Request) {
  if (!autorizarSegredoBridge(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const candidatos = await obterCandidatosDeHoje();

  return NextResponse.json({ geradoEm: new Date().toISOString(), candidatos });
}
