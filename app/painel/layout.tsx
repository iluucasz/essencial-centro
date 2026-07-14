import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const sessao = await auth();

  try {
    autorizarPapel(sessao, ["profissional", "recepcao"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      redirect("/entrar");
    }

    throw error;
  }

  return children;
}
