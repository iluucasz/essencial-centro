"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { FlaskConical } from "lucide-react";

import { alternarFuncaoTeste } from "@/modules/auth/actions";
import { funcoesUsuario, isFuncaoUsuario, rotulosFuncaoUsuario } from "@/modules/auth/rbac";

/** Só existe pra quem constrói a permissão testar admin/manager/reader na própria conta — ver
 * `alternarFuncaoTeste` em `modules/auth/actions.ts` pro porquê do e-mail travado lá. */
function Seletor() {
  const { data: sessao, update } = useSession();
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  const funcaoAtual = sessao?.user?.funcao ?? "";

  function mudar(valor: string) {
    if (!isFuncaoUsuario(valor)) return;

    startTransition(async () => {
      await alternarFuncaoTeste(valor);
      await update({ funcao: valor });
      // Não dá refresh() na página atual: se ela for admin-only (Usuários, Financeiro...) e a nova
      // função não for admin, a própria página quebraria assim que testasse. /painel é a única rota
      // que qualquer função sempre acessa.
      router.push("/painel");
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-dourado/50 bg-dourado/10 px-2 py-1.5 text-xs font-medium text-roxo">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Testar como</span>
      <select
        aria-label="Testar função (só você vê isso)"
        className="rounded-md border-0 bg-transparent py-0 pr-6 pl-1 text-xs font-semibold text-roxo focus:outline-none disabled:opacity-60"
        disabled={pendente}
        onChange={(evento) => mudar(evento.target.value)}
        value={funcaoAtual}
      >
        <option disabled value="">
          Selecione
        </option>
        {funcoesUsuario.map((funcao) => (
          <option key={funcao} value={funcao}>
            {rotulosFuncaoUsuario[funcao]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SeletorFuncaoTeste() {
  return (
    <SessionProvider>
      <Seletor />
    </SessionProvider>
  );
}
