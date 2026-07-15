import { Home, MapPin, Navigation } from "lucide-react";

import { construirLinkRotaGoogleMaps } from "@/modules/agenda/rota";

type ParadaDomiciliar = {
  id: string;
  inicio: Date;
  clienteNome: string;
  endereco: string | null;
};

function formatarHorario(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(data);
}

export function RotaDomiciliar({ paradas }: { paradas: ParadaDomiciliar[] }) {
  if (paradas.length === 0) return null;

  const link = construirLinkRotaGoogleMaps(paradas);

  return (
    <section className="grid gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Home className="size-4 text-dourado" aria-hidden="true" />
          Rota domiciliar do dia
        </h2>

        {link ? (
          <a
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href={link}
            rel="noreferrer"
            target="_blank"
          >
            <Navigation className="size-4" aria-hidden="true" />
            Abrir rota no Google Maps
          </a>
        ) : null}
      </div>

      <ul className="grid gap-2">
        {paradas.map((parada) => (
          <li className="flex items-start gap-2 text-sm text-foreground" key={parada.id}>
            <span className="font-semibold">{formatarHorario(parada.inicio)}</span>
            <span className="flex-1">
              {parada.clienteNome}
              {parada.endereco ? (
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3" aria-hidden="true" />
                  {parada.endereco}
                </span>
              ) : (
                <span className="mt-0.5 block text-xs text-perigo">
                  Sem endereço cadastrado — não entra na rota.
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
