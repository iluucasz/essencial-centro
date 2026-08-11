import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { precisaDefinirSenha } from "@/modules/auth/acesso-portal";
import { ErroAutorizacao } from "@/modules/auth/rbac";
import { exigirUsuarioAtualComImagem } from "@/modules/auth/queries";
import { groqConfigurado } from "@/modules/assistente/config";
import { listarHistoricoAssistente } from "@/modules/assistente/queries";
import { PainelShell } from "@/components/layout/painel-shell";

async function autorizar() {
  try {
    return exigirUsuarioAtualComImagem(["profissional", "recepcao"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      redirect("/entrar");
    }

    throw error;
  }
}

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const usuario = await autorizar();

  // Mesma regra do portal: conta com senha gerada pela clínica não navega antes de trocar a senha.
  if (await precisaDefinirSenha(usuario.id)) {
    redirect("/definir-senha");
  }

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
