import { NextResponse } from "next/server";

import { autorizarSegredoBridge, finalizarCadastro } from "@/modules/biometria/bridge";
import { finalizarCadastroSchema } from "@/modules/biometria/schema";

/** Finaliza um cadastro de digital iniciado por um código gerado no painel. Revalida qualidade e
 * consentimento de novo aqui — nunca confia só na checagem feita quando o código foi gerado. */
export async function POST(request: Request) {
  if (!autorizarSegredoBridge(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = finalizarCadastroSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const resultado = await finalizarCadastro(parsed.data);

  switch (resultado.tipo) {
    case "codigo_invalido":
      return NextResponse.json({ erro: "Código inválido ou expirado." }, { status: 404 });
    case "qualidade_insuficiente":
      return NextResponse.json(
        { erro: "Qualidade da captura abaixo do mínimo exigido." },
        { status: 400 },
      );
    case "sem_consentimento":
      return NextResponse.json(
        { erro: "Consentimento de biometria não está mais registrado para este cliente." },
        { status: 409 },
      );
    case "sucesso":
      return NextResponse.json({
        biometriaId: resultado.biometriaId,
        clienteId: resultado.clienteId,
        clienteNome: resultado.clienteNome,
        dedo: resultado.dedo,
      });
  }
}
