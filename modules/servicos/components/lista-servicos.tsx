import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { MenuAcoesServico } from "./menu-acoes-servico";
import type { OpcaoServicoResumo } from "./formulario-servico";

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
  style: "currency",
  currency: "BRL",
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
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Serviços cadastrados</h2>
          <p className="mt-1 text-sm text-muted">
            {servicos.length} {servicos.length === 1 ? "serviço" : "serviços"}
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto">
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
                    key={servico.id}
                    className="group transition-colors focus-within:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)]"
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
                              {servico.duracaoMinutos} min
                              {servico.ativo ? "" : " · inativo"}
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
