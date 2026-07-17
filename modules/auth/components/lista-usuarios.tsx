import { UserRound } from "lucide-react";

import { alternarAtivoUsuario } from "@/modules/auth/actions";
import { rotulosPapelUsuario, type PapelUsuario } from "@/modules/auth/rbac";

type UsuarioResumo = {
  id: string;
  name: string | null;
  email: string;
  role: PapelUsuario;
  ativo: boolean;
  criadoEm: Date;
};

const classePorPapel: Record<PapelUsuario, string> = {
  profissional: "bg-brand/15 text-brand",
  recepcao: "bg-lilas/25 text-roxo",
  cliente: "bg-creme text-muted",
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

export function ListaUsuarios({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: UsuarioResumo[];
  usuarioAtualId: string;
}) {
  if (usuarios.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <UserRound className="size-4" aria-hidden="true" />
        Nenhum usuário cadastrado ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {usuarios.map((u) => (
        <li
          key={u.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              {u.name ?? u.email}
              {u.id === usuarioAtualId ? (
                <span className="ml-2 text-xs font-normal text-muted">(você)</span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {u.email} · cadastrado em {formatadorData.format(u.criadoEm)}
            </span>
          </span>

          <span className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorPapel[u.role]}`}
            >
              {rotulosPapelUsuario[u.role]}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                u.ativo ? "bg-brand/15 text-brand" : "bg-perigo/15 text-perigo"
              }`}
            >
              {u.ativo ? "Ativo" : "Inativo"}
            </span>

            {u.id === usuarioAtualId ? null : (
              <form action={alternarAtivoUsuario}>
                <input name="id" type="hidden" value={u.id} />
                <input name="ativoAtual" type="hidden" value={String(u.ativo)} />
                <button
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-creme"
                  type="submit"
                >
                  {u.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
