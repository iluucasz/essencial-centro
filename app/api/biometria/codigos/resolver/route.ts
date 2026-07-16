import { NextResponse } from "next/server";

import { autorizarSegredoBridge, resolverCodigoCadastro } from "@/modules/biometria/bridge";
import { resolverCodigoSchema } from "@/modules/biometria/schema";

/** A ponte digita o código de 6 dígitos gerado na tela do cliente e descobre a quem ele pertence
 * — nunca precisa de busca/listagem própria de clientes. */
export async function POST(request: Request) {
  if (!autorizarSegredoBridge(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = resolverCodigoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const resolvido = await resolverCodigoCadastro(parsed.data.codigo);

  if (!resolvido) {
    return NextResponse.json({ erro: "Código inválido ou expirado." }, { status: 404 });
  }

  return NextResponse.json(resolvido);
}
