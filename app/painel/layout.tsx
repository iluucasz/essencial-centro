import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { precisaDefinirSenha } from "@/modules/auth/acesso-portal";
import { ErroAutorizacao } from "@/modules/auth/rbac";
import { exigirUsuarioAtualComImagem } from "@/modules/auth/queries";
import { groqConfigurado } from "@/modules/assistente/config";
import { listarHistoricoAssistente } from "@/modules/assistente/queries";
import { dispararAniversariosSeNecessarioHoje } from "@/modules/whatsapp/aniversario-lazy";
import { PainelShell } from "@/components/layout/painel-shell";

/**
 * Estende o tempo padrão das Server Actions/`after()` disparadas nas páginas do painel — o
 * `after()` abaixo pode rodar o envio de mensagens de aniversário do dia, que manda uma a uma com
 * pequena pausa (ver modules/whatsapp/actions.ts).
 */
export const maxDuration = 60;

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

  /*
    Roda DEPOIS da resposta ser enviada — não atrasa a página de ninguém. Sem `auth()`/`cookies()`
    aqui dentro (a função chamada não usa nenhum): Server Components não podem ler APIs de request
    dentro de `after()`, só o que já foi lido durante a renderização (ver doc do Next `after`).
  */
  after(() => dispararAniversariosSeNecessarioHoje());

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
