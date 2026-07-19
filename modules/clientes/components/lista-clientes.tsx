import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Mail, Phone, Target } from "lucide-react";

import type { FiltroCliente } from "@/modules/clientes/filtro";

import { FiltrosClientes } from "./filtros-clientes";
import { MenuAcoesCliente } from "./menu-acoes-cliente";
import type { ClienteFormulario } from "./formulario-cliente";

type ClienteResumo = ClienteFormulario & {
  criadoEm: Date;
  fotoPerfilId: string | null;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function getIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "CL";
}

function getContato(cliente: ClienteResumo) {
  if (cliente.email && cliente.telefone) return `${cliente.email} · ${cliente.telefone}`;
  if (cliente.email) return cliente.email;
  if (cliente.telefone) return cliente.telefone;

  return "Sem contato cadastrado";
}

function CelulaLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      className={`block h-full px-5 py-4 transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-roxo ${className}`}
      href={href}
    >
      {children}
    </Link>
  );
}

function LinhaMobile({
  children,
  className = "",
  icone,
}: {
  children: ReactNode;
  className?: string;
  icone: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-start gap-2 text-sm text-muted">
      {icone}
      <span className={`min-w-0 flex-1 break-words ${className}`}>{children}</span>
    </span>
  );
}

export function ListaClientes({
  clientes,
  busca,
  filtro,
  total,
  podeExcluir,
}: {
  clientes: ClienteResumo[];
  busca?: string;
  filtro: FiltroCliente;
  total: number;
  podeExcluir: boolean;
}) {
  return (
    <section className="min-w-0">
      <div className="grid gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">Clientes cadastrados</h2>
          <p className="mt-1 text-sm text-muted">
            {clientes.length} de {total} {total === 1 ? "cliente" : "clientes"}
          </p>
        </div>

        <div className="min-w-0">
          <FiltrosClientes busca={busca} filtro={filtro} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {clientes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Nenhum cliente encontrado.
          </div>
        ) : (
          clientes.map((cliente) => {
            const href = `/painel/clientes/${cliente.id}`;
            const temContato = Boolean(cliente.email || cliente.telefone);

            return (
              <article
                className="relative rounded-3xl border border-border bg-surface p-4 shadow-sm"
                key={cliente.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <Link
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    href={href}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                      {cliente.fotoPerfilId ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                          <img
                            alt={`Foto de ${cliente.nome}`}
                            className="size-full object-cover"
                            src={`/api/clientes/${cliente.id}/foto-perfil?v=${cliente.fotoPerfilId}`}
                          />
                        </>
                      ) : (
                        getIniciais(cliente.nome)
                      )}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="block truncate font-semibold text-foreground">
                        {cliente.nome}
                      </span>
                      <span className="block text-xs text-muted">
                        Nasc. {formatadorData.format(cliente.dataNascimento)}
                      </span>
                    </span>
                  </Link>

                  <MenuAcoesCliente cliente={cliente} podeExcluir={podeExcluir} />
                </div>

                <Link
                  className="mt-4 grid gap-2 border-t border-border pt-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                  href={href}
                >
                  {cliente.email ? (
                    <LinhaMobile
                      className="break-all"
                      icone={<Mail className="mt-0.5 size-4 shrink-0 text-roxo" aria-hidden />}
                    >
                      {cliente.email}
                    </LinhaMobile>
                  ) : null}
                  {cliente.telefone ? (
                    <LinhaMobile
                      icone={<Phone className="mt-0.5 size-4 shrink-0 text-roxo" aria-hidden />}
                    >
                      {cliente.telefone}
                    </LinhaMobile>
                  ) : null}
                  {!temContato ? (
                    <LinhaMobile
                      icone={<Mail className="mt-0.5 size-4 shrink-0 text-roxo" aria-hidden />}
                    >
                      Sem contato cadastrado
                    </LinhaMobile>
                  ) : null}
                  <LinhaMobile
                    className="line-clamp-2 text-foreground"
                    icone={<Target className="mt-0.5 size-4 shrink-0 text-roxo" aria-hidden />}
                  >
                    {cliente.objetivoTratamento ?? "Sem objetivo registrado"}
                  </LinhaMobile>
                  <LinhaMobile
                    className="text-xs"
                    icone={
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-roxo" aria-hidden />
                    }
                  >
                    Cadastro em {formatadorData.format(cliente.criadoEm)}
                  </LinhaMobile>
                </Link>
              </article>
            );
          })
        )}
      </div>

      <div className="relative mt-4 hidden overflow-x-auto rounded-3xl border border-border bg-surface p-5 shadow-sm md:block">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="w-[24%] px-5 py-4 font-semibold">Cliente</th>
              <th className="w-[28%] px-5 py-4 font-semibold">Contato</th>
              <th className="w-[28%] px-5 py-4 font-semibold">Objetivo</th>
              <th className="w-[14%] px-5 py-4 font-semibold">Cadastro</th>
              <th className="w-[6%] px-5 py-4 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clientes.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-muted" colSpan={5}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => {
                const href = `/painel/clientes/${cliente.id}`;
                const temContato = Boolean(cliente.email || cliente.telefone);

                return (
                  <tr
                    key={cliente.id}
                    className="group transition-colors focus-within:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]"
                  >
                    <td className="align-middle">
                      <CelulaLink href={href}>
                        <span className="flex items-center gap-3">
                          <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-base font-semibold text-brand-foreground">
                            {cliente.fotoPerfilId ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                                <img
                                  alt={`Foto de ${cliente.nome}`}
                                  className="size-full object-cover"
                                  src={`/api/clientes/${cliente.id}/foto-perfil?v=${cliente.fotoPerfilId}`}
                                />
                              </>
                            ) : (
                              getIniciais(cliente.nome)
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                              {cliente.nome}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              Nasc. {formatadorData.format(cliente.dataNascimento)}
                            </span>
                          </span>
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="text-muted" href={href}>
                        <span className="flex min-w-0 items-center gap-2">
                          {temContato ? (
                            cliente.email ? (
                              <Mail className="size-4 shrink-0 text-roxo" aria-hidden="true" />
                            ) : (
                              <Phone className="size-4 shrink-0 text-roxo" aria-hidden="true" />
                            )
                          ) : null}
                          <span className="truncate">{getContato(cliente)}</span>
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="text-muted" href={href}>
                        <span className="line-clamp-2 max-w-xs">
                          {cliente.objetivoTratamento ?? "Sem objetivo registrado"}
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="text-muted" href={href}>
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="size-4 text-roxo" aria-hidden="true" />
                          {formatadorData.format(cliente.criadoEm)}
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="px-5 py-4 text-right align-middle">
                      <MenuAcoesCliente cliente={cliente} podeExcluir={podeExcluir} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
