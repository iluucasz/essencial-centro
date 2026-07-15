import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { PainelShell } from "@/components/layout/painel-shell";

async function autorizar() {
  try {
    const sessao = await auth();

    return autorizarPapel(sessao, ["profissional", "recepcao"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      redirect("/entrar");
    }

    throw error;
  }
}

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const usuario = await autorizar();

  return <PainelShell usuario={usuario}>{children}</PainelShell>;
}
