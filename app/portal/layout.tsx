import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { precisaDefinirSenha } from "@/modules/auth/acesso-portal";
import { autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const sessao = await auth();

  try {
    autorizarPapel(sessao, ["cliente"]);
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      redirect("/entrar");
    }

    throw error;
  }

  /*
    Senha provisória pendente bloqueia o portal inteiro: ela foi gerada e repassada pela clínica, então
    enquanto valer há outra pessoa capaz de entrar nesta conta — e aqui dentro há dado de saúde.
  */
  if (sessao?.user?.id && (await precisaDefinirSenha(sessao.user.id))) {
    redirect("/definir-senha");
  }

  return children;
}
