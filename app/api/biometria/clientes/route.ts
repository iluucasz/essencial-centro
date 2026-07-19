import { NextResponse } from "next/server";

import { autorizarSegredoBridge, buscarClientesParaCadastro } from "@/modules/biometria/bridge";

/** A ponte busca o cliente pelo nome antes de cadastrar uma digital nova — só clientes com
 * consentimento de biometria já registrado aparecem (ver buscarClientesParaCadastro). */
export async function GET(request: Request) {
  if (!autorizarSegredoBridge(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const busca = searchParams.get("busca") ?? "";
  const clientes = await buscarClientesParaCadastro(busca);

  return NextResponse.json({ clientes });
}
