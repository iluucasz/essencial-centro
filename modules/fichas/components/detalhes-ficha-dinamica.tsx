import { campoEhInput, type CampoModelo } from "@/modules/fichas/campos";

function valorVazio(valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return true;
  if (Array.isArray(valor)) return valor.length === 0;

  return false;
}

function formatarValor(campo: CampoModelo, valor: unknown): string | null {
  if (campo.tipo === "sim_nao" && valor && typeof valor === "object") {
    const sim = (valor as { valor?: boolean }).valor;
    const detalhe = (valor as { detalhe?: string }).detalhe;

    if (!sim) return "Não";

    return detalhe ? `Sim — ${detalhe}` : "Sim";
  }

  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(", ") : null;
  if (typeof valor === "number") return valor.toLocaleString("pt-BR");
  if (typeof valor === "string") return valor.trim() || null;

  return null;
}

/** Visualização somente-leitura de uma ficha dinâmica, guiada pelos campos do modelo. */
export function DetalhesFichaDinamica({
  campos,
  respostas,
}: {
  campos: CampoModelo[];
  respostas: Record<string, unknown>;
}) {
  return (
    <div className="grid gap-3">
      {campos.map((campo) => {
        if (campo.tipo === "secao") {
          return (
            <h3
              className="mt-2 border-b border-lilas/30 pb-1 font-semibold text-roxo first:mt-0"
              key={campo.id}
            >
              {campo.rotulo}
            </h3>
          );
        }

        if (!campoEhInput(campo.tipo)) return null;

        const valor = formatarValor(campo, respostas[campo.id]);

        if (valorVazio(valor)) return null;

        return (
          <div className="grid gap-1" key={campo.id}>
            <dt className="text-xs font-semibold text-muted">{campo.rotulo}</dt>
            <dd className="text-sm leading-6 whitespace-pre-wrap text-foreground">{valor}</dd>
          </div>
        );
      })}
    </div>
  );
}
