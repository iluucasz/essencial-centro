"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { atualizarUsuario, criarUsuario, type EstadoFormularioAuth } from "@/modules/auth/actions";
import {
  funcoesUsuario,
  papeisUsuario,
  rotulosFuncaoUsuario,
  rotulosPapelUsuario,
  type FuncaoUsuario,
  type PapelUsuario,
} from "@/modules/auth/rbac";
import { useFecharModal } from "@/components/ui/modal-formulario";

const estadoInicial: EstadoFormularioAuth = { status: "inicial" };

const classeInput =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

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
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error?.length ? <p className="text-sm text-perigo">{error[0]}</p> : null}
    </div>
  );
}

export type UsuarioFormulario = {
  id: string;
  nome: string;
  email: string;
  role: PapelUsuario;
  clienteId: string | null;
  funcao: FuncaoUsuario | null;
  cargo: string | null;
};

/** Recepção nunca vira admin — mesma regra de `validarFuncaoPorPapel` em `modules/auth/schema.ts`,
 * repetida aqui só pra já não oferecer a opção no menu (o servidor recusa de qualquer forma). */
function funcoesDisponiveisParaPapel(papel: PapelUsuario) {
  return papel === "recepcao" ? funcoesUsuario.filter((f) => f !== "admin") : funcoesUsuario;
}

export function FormularioUsuario({
  clientes,
  usuario,
}: {
  clientes: { id: string; nome: string }[];
  usuario?: UsuarioFormulario;
}) {
  const fecharModal = useFecharModal();
  const [state, formAction, pending] = useActionState(
    usuario ? atualizarUsuario : criarUsuario,
    estadoInicial,
  );
  const [papel, setPapel] = useState<PapelUsuario>(usuario?.role ?? "profissional");
  const [funcao, setFuncao] = useState<FuncaoUsuario>(usuario?.funcao ?? "manager");

  function mudarPapel(novoPapel: PapelUsuario) {
    setPapel(novoPapel);

    // Recepção não pode ficar com "admin" selecionado por trás — cai pra manager automaticamente.
    if (novoPapel === "recepcao" && funcao === "admin") {
      setFuncao("manager");
    }
  }

  useEffect(() => {
    if (state.status === "sucesso") {
      fecharModal();
    }
  }, [state.status, fecharModal]);

  return (
    <form action={formAction} className="grid min-w-0 gap-5">
      {usuario ? <input name="id" type="hidden" value={usuario.id} /> : null}

      <Campo error={state.campos?.nome} htmlFor="nome" label="Nome">
        <input
          className={classeInput}
          defaultValue={usuario?.nome}
          id="nome"
          name="nome"
          placeholder="Ex.: Lucas Santos"
        />
      </Campo>

      <Campo error={state.campos?.email} htmlFor="email" label="E-mail">
        <input
          className={classeInput}
          defaultValue={usuario?.email}
          id="email"
          name="email"
          placeholder="Ex.: usuario@email.com"
          type="email"
        />
      </Campo>

      {usuario ? null : (
        <Campo error={state.campos?.senha} htmlFor="senha" label="Senha (mínimo 8 caracteres)">
          <input
            autoComplete="new-password"
            className={classeInput}
            id="senha"
            name="senha"
            placeholder="Crie uma senha segura"
            type="password"
          />
        </Campo>
      )}

      <Campo error={state.campos?.role} htmlFor="role" label="Papel">
        <select
          className={classeInput}
          id="role"
          name="role"
          onChange={(evento) => mudarPapel(evento.target.value as PapelUsuario)}
          value={papel}
        >
          {papeisUsuario.map((p) => (
            <option key={p} value={p}>
              {rotulosPapelUsuario[p]}
            </option>
          ))}
        </select>
      </Campo>

      {papel === "cliente" ? null : (
        <>
          <Campo error={state.campos?.funcao} htmlFor="funcao" label="Função">
            <select
              className={classeInput}
              id="funcao"
              name="funcao"
              onChange={(evento) => setFuncao(evento.target.value as FuncaoUsuario)}
              value={funcao}
            >
              {funcoesDisponiveisParaPapel(papel).map((f) => (
                <option key={f} value={f}>
                  {rotulosFuncaoUsuario[f]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              Admin vê Financeiro, Relatórios e Usuários. Manager usa o resto do painel normalmente.
              Reader só visualiza — não cria, edita nem exclui nada.
            </p>
          </Campo>

          <Campo error={state.campos?.cargo} htmlFor="cargo" label="Cargo (opcional)">
            <input
              className={classeInput}
              defaultValue={usuario?.cargo ?? ""}
              id="cargo"
              maxLength={120}
              name="cargo"
              placeholder="Ex.: Terapeuta Ortomolecular"
            />
            <p className="text-xs text-muted">
              Título livre, só descritivo. Aparece no PDF de recomendação terapêutica emitido por
              esta pessoa.
            </p>
          </Campo>
        </>
      )}

      {papel === "cliente" ? (
        <Campo error={state.campos?.clienteId} htmlFor="clienteId" label="Cliente vinculado">
          <select
            className={classeInput}
            defaultValue={usuario?.clienteId ?? ""}
            id="clienteId"
            name="clienteId"
            required
          >
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

      <div className="flex justify-end border-t border-border/70 pt-4">
        <button
          className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:cursor-not-allowed disabled:opacity-70"
          disabled={pending}
          type="submit"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          {usuario ? "Salvar alterações" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
