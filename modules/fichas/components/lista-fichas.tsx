import { ClipboardList } from "lucide-react";

import {
  rotulosStatusFicha,
  rotulosTipoFicha,
  type StatusFicha,
  type TipoFicha,
} from "@/modules/fichas/schema";

type FichaResumo = {
  id: string;
  tipo: TipoFicha;
  status: StatusFicha;
  criadoEm: Date;
};

const classePorStatus: Record<StatusFicha, string> = {
  rascunho: "bg-creme text-muted",
  preenchida: "bg-lilas/25 text-roxo",
  revisada: "bg-dourado/20 text-dourado",
  assinada: "bg-brand/15 text-brand",
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(data);
}

export function ListaFichas({ fichas }: { fichas: FichaResumo[] }) {
  if (fichas.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <ClipboardList className="size-4" aria-hidden="true" />
        Nenhuma ficha registrada ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {fichas.map((f) => (
        <li
          key={f.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
        >
          <span className="text-sm font-medium text-foreground">{rotulosTipoFicha[f.tipo]}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted">{formatarData(f.criadoEm)}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatus[f.status]}`}
            >
              {rotulosStatusFicha[f.status]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
