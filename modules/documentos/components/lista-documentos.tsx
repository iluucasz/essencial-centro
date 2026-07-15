import { FileText } from "lucide-react";

import {
  rotulosStatusDocumento,
  rotulosTipoDocumento,
  type StatusDocumento,
  type TipoDocumento,
} from "@/modules/documentos/schema";

type DocumentoResumo = {
  id: string;
  tipo: TipoDocumento;
  titulo: string;
  status: StatusDocumento;
  criadoEm: Date;
};

const classePorStatus: Record<StatusDocumento, string> = {
  emitido: "bg-lilas/25 text-roxo",
  assinado: "bg-brand/15 text-brand",
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(data);
}

export function ListaDocumentos({ documentos }: { documentos: DocumentoResumo[] }) {
  if (documentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <FileText className="size-4" aria-hidden="true" />
        Nenhum documento emitido ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {documentos.map((d) => (
        <li
          key={d.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">{d.titulo}</span>
            <span className="mt-0.5 block text-xs text-muted">{rotulosTipoDocumento[d.tipo]}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted">{formatarData(d.criadoEm)}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${classePorStatus[d.status]}`}
            >
              {rotulosStatusDocumento[d.status]}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
