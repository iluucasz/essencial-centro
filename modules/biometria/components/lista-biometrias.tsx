import { Fingerprint } from "lucide-react";

import { desativarBiometria } from "@/modules/biometria/actions";
import { rotulosDedoBiometria, type DedoBiometria } from "@/modules/biometria/schema";

type BiometriaResumo = {
  id: string;
  dedo: DedoBiometria;
  qualidadeCaptura: number;
  criadoEm: Date;
  criadoPorNome: string | null;
};

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

export function ListaBiometrias({
  clienteId,
  biometrias,
}: {
  clienteId: string;
  biometrias: BiometriaResumo[];
}) {
  if (biometrias.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <Fingerprint className="size-4" aria-hidden="true" />
        Nenhuma digital cadastrada ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {biometrias.map((b) => (
        <li
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              {rotulosDedoBiometria[b.dedo]}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Qualidade {b.qualidadeCaptura} · cadastrada em {formatadorDataHora.format(b.criadoEm)}
              {b.criadoPorNome ? ` por ${b.criadoPorNome}` : ""}
            </span>
          </span>

          <form action={desativarBiometria}>
            <input name="id" type="hidden" value={b.id} />
            <input name="clienteId" type="hidden" value={clienteId} />
            <button
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-creme"
              type="submit"
            >
              Desativar
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
