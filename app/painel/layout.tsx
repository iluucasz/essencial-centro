import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { groqConfigurado } from "@/modules/assistente/config";
import { listarHistoricoAssistente } from "@/modules/assistente/queries";
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

  const assistenteDisponivel = usuario.role === "profissional" && groqConfigurado();
  const historicoAssistente = assistenteDisponivel ? await listarHistoricoAssistente() : [];

  return (
    <PainelShell
      assistenteDisponivel={assistenteDisponivel}
      historicoAssistente={historicoAssistente}
      usuario={usuario}
    >
      {children}
    </PainelShell>
  );
}
