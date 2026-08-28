import { Cake } from "lucide-react";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

export function HistoricoAniversarios({
  envios,
}: {
  envios: { id: string; clienteNome: string; enviadoEm: Date }[];
}) {
  if (envios.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-creme/40 p-4 text-sm text-muted">
        Nenhuma mensagem de aniversário enviada ainda.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {envios.map((envio) => (
        <li
          key={envio.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lilas/35 text-roxo">
            <Cake className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-sm">
            <span className="font-medium text-foreground">{envio.clienteNome}</span>
            <span className="text-muted"> — {formatadorData.format(envio.enviadoEm)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
