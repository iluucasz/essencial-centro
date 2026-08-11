import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { auth } from "@/auth";
import { ErroAutorizacao, autorizarPapel } from "@/modules/auth/rbac";

/**
 * Sobe a imagem de uma opção ilustrada do construtor de fichas (ex.: cada tipo da escala de Bristol).
 *
 * Devolve a URL **pública** do blob, e isso é deliberado: o formulário do cliente
 * (`/ficha/[token]`) abre SEM login, então a figura tem que carregar sem sessão. Diferente de foto de
 * cliente ou exame, aqui a arte é ativo do MODELO de ficha — não é dado de saúde de ninguém, então
 * não passa por proxy autenticado.
 *
 * Quem sobe, porém, é só `profissional`: senão qualquer um encheria o blob store.
 */
export const runtime = "nodejs";

const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const LIMITE_BYTES = 4 * 1024 * 1024;

function ehArquivo(valor: FormDataEntryValue | null): valor is File {
  return typeof valor === "object" && valor !== null && "arrayBuffer" in valor && "size" in valor;
}

export async function POST(request: Request) {
  try {
    autorizarPapel(await auth(), ["profissional"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      return new NextResponse(error.message, { status: error.status });
    }

    throw error;
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");

  if (!ehArquivo(arquivo)) {
    return NextResponse.json({ erro: "Escolha uma imagem." }, { status: 400 });
  }

  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return NextResponse.json({ erro: "Use PNG, JPG ou WebP." }, { status: 400 });
  }

  if (arquivo.size <= 0 || arquivo.size > LIMITE_BYTES) {
    return NextResponse.json({ erro: "A imagem precisa ter até 4 MB." }, { status: 400 });
  }

  const nome = arquivo.name.split(/[\\/]/).pop()?.slice(0, 120) || "opcao.png";

  const blob = await put(`fichas/opcoes/${nome}`, arquivo, {
    access: "public",
    addRandomSuffix: true,
    contentType: arquivo.type,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
