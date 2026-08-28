import { CheckCircle2, Send, Users, XCircle } from "lucide-react";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

const rotulosDestinatarios: Record<"todos" | "selecionados", string> = {
  todos: "Todos os clientes",
  selecionados: "Clientes selecionados",
};

export function HistoricoCampanhas({
  campanhas,
}: {
  campanhas: {
    id: string;
    conteudo: string;
    destinatarios: "todos" | "selecionados";
    criadoEm: Date;
    enviados: number;
    falhas: number;
  }[];
}) {
  if (campanhas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-creme/40 p-4 text-sm text-muted">
        Nenhum envio feito ainda.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {campanhas.map((campanha) => (
        <li key={campanha.id} className="grid gap-2 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Send className="size-4 text-roxo" aria-hidden="true" />
              {formatadorData.format(campanha.criadoEm)}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-lilas/25 px-2.5 py-1 text-xs font-medium text-roxo">
              <Users className="size-3.5" aria-hidden="true" />
              {rotulosDestinatarios[campanha.destinatarios]}
            </span>
          </div>

          <p className="line-clamp-2 text-sm break-words text-muted">{campanha.conteudo}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-brand">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {campanha.enviados} enviada{campanha.enviados === 1 ? "" : "s"}
            </span>
            {campanha.falhas > 0 ? (
              <span className="flex items-center gap-1 text-perigo">
                <XCircle className="size-3.5" aria-hidden="true" />
                {campanha.falhas} {campanha.falhas === 1 ? "falhou" : "falharam"}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
