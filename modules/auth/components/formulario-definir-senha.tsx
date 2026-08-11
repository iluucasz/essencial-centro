"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";

import { definirPrimeiraSenha, type EstadoFormularioAuth } from "../actions";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

/**
 * Troca obrigatória da senha provisória. Depois do sucesso força um `router.refresh()` antes de ir
 * pro destino: o guarda de layout lê `deveTrocarSenha` do banco, e sem a revalidação a navegação
 * usaria a resposta em cache que ainda manda pra cá.
 */
export function FormularioDefinirSenha({ destino }: { destino: string }) {
  const [estado, enviar, pendente] = useActionState(definirPrimeiraSenha, estadoInicial);
  const router = useRouter();

  if (estado.status === "sucesso") {
    return (
      <div className="grid gap-4 text-center">
        <p className="text-sm text-foreground">
          Senha definida com sucesso. Use ela nas próximas entradas.
        </p>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => {
            router.refresh();
            router.replace(destino);
          }}
          type="button"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <form action={enviar} className="grid gap-4">
      <Campo
        autoComplete="new-password"
        erro={estado.campos?.novaSenha}
        label="Nova senha"
        name="novaSenha"
        dica="Pelo menos 8 caracteres."
      />
      <Campo
        autoComplete="new-password"
        erro={estado.campos?.confirmarNovaSenha}
        label="Confirmar nova senha"
        name="confirmarNovaSenha"
      />

      {estado.status === "erro" && estado.mensagem ? (
        <p
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
          role="alert"
        >
          {estado.mensagem}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pendente}
        type="submit"
      >
        {pendente ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        Salvar minha senha
      </button>
    </form>
  );
}

function Campo({
  autoComplete,
  dica,
  erro,
  label,
  name,
}: {
  autoComplete: string;
  dica?: string;
  erro?: string[];
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-brand focus:outline-none"
        name={name}
        required
        type="password"
      />
      {dica && !erro?.length ? <span className="text-xs text-muted">{dica}</span> : null}
      {erro?.length ? <span className="text-xs text-perigo">{erro[0]}</span> : null}
    </label>
  );
}
