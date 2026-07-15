import { ImageOff } from "lucide-react";

type FotoResumo = {
  id: string;
  regiao: string;
  dataFoto: Date;
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(data);
}

function agruparPorRegiao(fotos: FotoResumo[]) {
  const grupos = new Map<string, FotoResumo[]>();

  for (const foto of fotos) {
    const lista = grupos.get(foto.regiao) ?? [];
    lista.push(foto);
    grupos.set(foto.regiao, lista);
  }

  for (const lista of grupos.values()) {
    lista.sort((a, b) => a.dataFoto.getTime() - b.dataFoto.getTime());
  }

  return grupos;
}

export function GaleriaFotos({ fotos }: { fotos: FotoResumo[] }) {
  if (fotos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <ImageOff className="size-4" aria-hidden="true" />
        Nenhuma foto registrada ainda.
      </div>
    );
  }

  const grupos = agruparPorRegiao(fotos);

  return (
    <div className="grid gap-6">
      {[...grupos.entries()].map(([regiao, itens]) => (
        <div key={regiao} className="grid gap-2">
          <h3 className="text-sm font-semibold text-foreground">{regiao}</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {itens.map((item, indice) => {
              const rotulo =
                itens.length > 1
                  ? indice === 0
                    ? "Antes"
                    : indice === itens.length - 1
                      ? "Atual"
                      : null
                  : null;

              return (
                <figure key={item.id} className="w-32 shrink-0">
                  <div className="relative overflow-hidden rounded-lg border border-border bg-creme">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                    <img
                      alt={`${regiao} — ${formatarData(item.dataFoto)}`}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                      src={`/api/fotos/${item.id}/imagem`}
                    />
                    {rotulo ? (
                      <span className="absolute top-1 left-1 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-brand-foreground">
                        {rotulo}
                      </span>
                    ) : null}
                  </div>
                  <figcaption className="mt-1 text-xs text-muted">
                    {formatarData(item.dataFoto)}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
