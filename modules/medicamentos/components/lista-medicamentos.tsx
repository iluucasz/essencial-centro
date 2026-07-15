import { CheckCircle2, Pill, TriangleAlert } from "lucide-react";

import { confirmarVerificacaoMedicamento } from "@/modules/medicamentos/actions";
import { precisaVerificacao } from "@/modules/medicamentos/verificacao";

type MedicamentoResumo = {
  id: string;
  nome: string;
  dosagem: string | null;
  frequencia: string | null;
  profissionalPrescritor: string | null;
  dataInicio: Date | null;
  alergiaRelacionada: string | null;
  alertaInteracao: string | null;
  fonteAlerta: string | null;
  verificadoEm: Date | null;
  verificadoPorNome: string | null;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "UTC",
});

export function ListaMedicamentos({
  clienteId,
  medicamentos,
}: {
  clienteId: string;
  medicamentos: MedicamentoResumo[];
}) {
  if (medicamentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        <Pill className="size-4" aria-hidden="true" />
        Nenhum medicamento informado ainda.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {medicamentos.map((m) => (
        <li key={m.id} className="grid gap-2 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-medium text-foreground">{m.nome}</span>
              <span className="mt-0.5 block text-xs text-muted">
                {[
                  m.dosagem,
                  m.frequencia,
                  m.profissionalPrescritor ? `prescrito por ${m.profissionalPrescritor}` : null,
                  m.dataInicio ? `início ${formatadorData.format(m.dataInicio)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sem detalhes adicionais"}
              </span>
            </span>

            {m.verificadoEm ? (
              <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Verificado {formatadorDataHora.format(m.verificadoEm)}
                {m.verificadoPorNome ? ` por ${m.verificadoPorNome}` : ""}
              </span>
            ) : precisaVerificacao(m.verificadoEm) ? (
              <form action={confirmarVerificacaoMedicamento}>
                <input name="id" type="hidden" value={m.id} />
                <input name="clienteId" type="hidden" value={clienteId} />
                <button
                  className="flex items-center gap-1 rounded-full bg-dourado/20 px-2.5 py-1 text-xs font-medium text-dourado transition hover:bg-dourado/30"
                  type="submit"
                >
                  <TriangleAlert className="size-3" aria-hidden="true" />
                  Confirmar verificação
                </button>
              </form>
            ) : null}
          </div>

          {m.alergiaRelacionada ? (
            <p className="text-sm text-foreground">
              <span className="font-medium">Alergia relacionada: </span>
              {m.alergiaRelacionada}
            </p>
          ) : null}

          {m.alertaInteracao ? (
            <p className="text-sm text-perigo">
              <span className="font-medium">Alerta de interação: </span>
              {m.alertaInteracao}
              {m.fonteAlerta ? ` (fonte: ${m.fonteAlerta})` : ""}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
