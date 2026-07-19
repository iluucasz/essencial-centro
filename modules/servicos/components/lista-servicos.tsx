import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";

import type { OpcaoServicoResumo } from "./formulario-servico";
import { MenuAcoesServico } from "./menu-acoes-servico";

type ServicoResumo = {
  id: string;
  nome: string;
  grupo: string;
  descricao: string | null;
  indicacao: string | null;
  contraindicacoes: string | null;
  duracaoMinutos: number;
  valorCentavos: number | null;
  periodicidade: string | null;
  preparo: string | null;
  cuidadosPosteriores: string | null;
  ativo: boolean;
};

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatarValor(valorCentavos: number | null) {
  if (valorCentavos === null) return "Valor a definir";

  return formatadorMoeda.format(valorCentavos / 100);
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

function ValorCompacto({
  className = "",
  label,
  valor,
}: {
  className?: string;
  label: string;
  valor: ReactNode;
}) {
  return (
    <div className={`min-w-0 rounded-2xl bg-creme px-3 py-2 ${className}`}>
      <span className="block text-xs font-semibold text-muted">{label}</span>
      <span className="mt-1 flex min-w-0 items-center gap-1 text-sm font-semibold break-words text-foreground">
        {valor}
      </span>
    </div>
  );
}

function CartaoServicoMobile({
  opcoesGrupo,
  opcoesPeriodicidade,
  podeGerenciar,
  servico,
}: {
  opcoesGrupo: OpcaoServicoResumo[];
  opcoesPeriodicidade: OpcaoServicoResumo[];
  podeGerenciar: boolean;
  servico: ServicoResumo;
}) {
  const href = `/painel/servicos/${servico.id}`;

  return (
    <article className="relative rounded-3xl border border-border bg-surface">
      <div className="grid gap-4 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href={href}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/35 text-roxo">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="block truncate text-base font-semibold text-foreground">
                {servico.nome}
              </span>
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm text-muted">{servico.grupo}</span>
                <span
                  className={
                    servico.ativo
                      ? "rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand"
                      : "rounded-full bg-dourado/20 px-2.5 py-1 text-xs font-semibold text-dourado"
                  }
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </span>
              </span>
            </span>
          </Link>

          {podeGerenciar ? (
            <MenuAcoesServico
              opcoesGrupo={opcoesGrupo}
              opcoesPeriodicidade={opcoesPeriodicidade}
              servico={servico}
            />
          ) : null}
        </div>

        {servico.descricao ? (
          <p className="line-clamp-2 text-sm leading-6 text-foreground">{servico.descricao}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          <ValorCompacto label="Valor" valor={formatarValor(servico.valorCentavos)} />
          <ValorCompacto
            label="Duração"
            valor={
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5 text-roxo" aria-hidden="true" />
                {servico.duracaoMinutos} min
              </span>
            }
          />
          <ValorCompacto
            className="min-[380px]:col-span-2"
            label="Periodicidade"
            valor={servico.periodicidade ?? "Sem periodicidade"}
          />
        </div>
      </div>

      <Link
        className="flex h-11 items-center justify-between rounded-b-3xl border-t border-border px-4 text-sm font-semibold text-roxo transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-roxo"
        href={href}
      >
        Ver detalhes
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function ListaServicos({
  opcoesGrupo,
  opcoesPeriodicidade,
  podeGerenciar,
  servicos,
}: {
  opcoesGrupo: OpcaoServicoResumo[];
  opcoesPeriodicidade: OpcaoServicoResumo[];
  podeGerenciar: boolean;
  servicos: ServicoResumo[];
}) {
  return (
    <section className="min-w-0">
      <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">Serviços cadastrados</h2>
          <p className="mt-1 text-sm text-muted">
            {servicos.length} {servicos.length === 1 ? "serviço" : "serviços"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {servicos.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Nenhum serviço cadastrado ainda.
          </div>
        ) : (
          servicos.map((servico) => (
            <CartaoServicoMobile
              key={servico.id}
              opcoesGrupo={opcoesGrupo}
              opcoesPeriodicidade={opcoesPeriodicidade}
              podeGerenciar={podeGerenciar}
              servico={servico}
            />
          ))
        )}
      </div>

      <div className="relative hidden overflow-x-auto rounded-3xl border border-border bg-surface p-5 shadow-sm md:block">
        <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="w-[32%] px-5 py-4 font-semibold">Serviço</th>
              <th className="w-[18%] px-5 py-4 font-semibold">Grupo</th>
              <th className="w-[18%] px-5 py-4 font-semibold">Periodicidade</th>
              <th className="w-[16%] px-5 py-4 font-semibold">Valor</th>
              <th className="w-[16%] px-5 py-4 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {servicos.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-muted" colSpan={5}>
                  Nenhum serviço cadastrado ainda.
                </td>
              </tr>
            ) : (
              servicos.map((servico) => {
                const href = `/painel/servicos/${servico.id}`;

                return (
                  <tr
                    className="group transition-colors focus-within:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]"
                    key={servico.id}
                  >
                    <td className="align-middle">
                      <CelulaLink href={href}>
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-lilas/35 text-roxo">
                            <Sparkles className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                              {servico.nome}
                            </span>
                            <span className="mt-1 block text-xs text-muted">
                              {servico.duracaoMinutos} min{servico.ativo ? "" : " · inativo"}
                            </span>
                          </span>
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="text-muted" href={href}>
                        <span className="truncate">{servico.grupo}</span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="text-muted" href={href}>
                        <span className="truncate">
                          {servico.periodicidade ?? "Sem periodicidade"}
                        </span>
                      </CelulaLink>
                    </td>
                    <td className="align-middle">
                      <CelulaLink className="font-medium text-foreground" href={href}>
                        {formatarValor(servico.valorCentavos)}
                      </CelulaLink>
                    </td>
                    <td className="px-5 py-4 text-right align-middle">
                      {podeGerenciar ? (
                        <MenuAcoesServico
                          opcoesGrupo={opcoesGrupo}
                          opcoesPeriodicidade={opcoesPeriodicidade}
                          servico={servico}
                        />
                      ) : null}
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
