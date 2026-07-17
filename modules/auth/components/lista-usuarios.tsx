import { UserRound } from "lucide-react";

import { alternarAtivoUsuario } from "@/modules/auth/actions";
import { rotulosPapelUsuario, type PapelUsuario } from "@/modules/auth/rbac";
import { MenuFotoUsuario } from "@/modules/fotos/components/menu-foto-usuario";

type UsuarioResumo = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
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

function getIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "US";
}

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
      {usuarios.map((u) => {
        const nome = u.name ?? u.email;

        return (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-14 shrink-0">
                <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-brand text-base font-semibold text-brand-foreground">
                  {u.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                      <img
                        alt={`Foto de ${nome}`}
                        className="size-full object-cover"
                        src={`/api/usuarios/${u.id}/foto?v=${encodeURIComponent(u.image)}`}
                      />
                    </>
                  ) : (
                    getIniciais(nome)
                  )}
                </span>
                <MenuFotoUsuario temFoto={Boolean(u.image)} usuarioId={u.id} usuarioNome={nome} />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {nome}
                  {u.id === usuarioAtualId ? (
                    <span className="ml-2 text-xs font-normal text-muted">(você)</span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {u.email} · cadastrado em {formatadorData.format(u.criadoEm)}
                </span>
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
        );
      })}
    </ul>
  );
}
