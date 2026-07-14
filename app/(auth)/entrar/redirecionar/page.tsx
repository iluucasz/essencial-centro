import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDestinoAposLogin } from "@/modules/auth/rbac";

export default async function RedirecionarEntradaPage() {
  const sessao = await auth();

  if (!sessao?.user?.role) {
    redirect("/entrar");
  }

  redirect(getDestinoAposLogin(sessao.user.role));
}
