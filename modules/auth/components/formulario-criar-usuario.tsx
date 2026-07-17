"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { criarUsuario, type EstadoFormularioAuth } from "@/modules/auth/actions";
import { papeisUsuario, rotulosPapelUsuario, type PapelUsuario } from "@/modules/auth/rbac";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

const classeInput =
  "h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20";

function Campo({
  children,
  error,
  label,
  htmlFor,
}: {
  children: React.ReactNode;
  error?: string[];
  label: string;
  htmlFor: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error?.length ? <p className="text-sm text-perigo">{error[0]}</p> : null}
    </div>
  );
}

export function FormularioCriarUsuario({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const fecharModal = useFecharModal();
  const [state, formAction, pending] = useActionState(criarUsuario, estadoInicial);
  const [papel, setPapel] = useState<PapelUsuario>("profissional");

  useEffect(() => {
    if (state.status === "sucesso") {
      fecharModal();
    }
  }, [state.status, fecharModal]);

  return (
    <form action={formAction} className="grid gap-5">
      <Campo error={state.campos?.nome} htmlFor="nome" label="Nome">
        <input className={classeInput} id="nome" name="nome" />
      </Campo>

      <Campo error={state.campos?.email} htmlFor="email" label="E-mail">
        <input className={classeInput} id="email" name="email" type="email" />
      </Campo>

      <Campo error={state.campos?.senha} htmlFor="senha" label="Senha (mínimo 8 caracteres)">
        <input
          autoComplete="new-password"
          className={classeInput}
          id="senha"
          name="senha"
          type="password"
        />
      </Campo>

      <Campo error={state.campos?.role} htmlFor="role" label="Papel">
        <select
          className={classeInput}
          id="role"
          name="role"
          onChange={(evento) => setPapel(evento.target.value as PapelUsuario)}
          value={papel}
        >
          {papeisUsuario.map((p) => (
            <option key={p} value={p}>
              {rotulosPapelUsuario[p]}
            </option>
          ))}
        </select>
      </Campo>

      {papel === "cliente" ? (
        <Campo error={state.campos?.clienteId} htmlFor="clienteId" label="Cliente vinculado">
          <select className={classeInput} id="clienteId" name="clienteId" required>
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}

      {state.status === "erro" && state.mensagem ? (
        <p className="text-sm font-medium text-perigo" role="alert">
          {state.mensagem}
        </p>
      ) : null}

      <button
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        Criar usuário
      </button>
    </form>
  );
}
