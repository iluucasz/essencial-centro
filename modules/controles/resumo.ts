import { tiposControle, type RegistroControle, type TipoControle } from "./schema";

/**
 * Data do registro mais recente de cada tipo — o "quando foi a última vez" que aparece nos
 * cartões. `null` quando o tipo nunca foi registrado ainda.
 */
export function ultimaDataPorTipo(
  registros: Pick<RegistroControle, "tipo" | "dataRealizacao">[],
): Record<TipoControle, Date | null> {
  const resultado = Object.fromEntries(tiposControle.map((tipo) => [tipo, null])) as Record<
    TipoControle,
    Date | null
  >;

  for (const registro of registros) {
    const atual = resultado[registro.tipo];

    if (!atual || registro.dataRealizacao.getTime() > atual.getTime()) {
      resultado[registro.tipo] = registro.dataRealizacao;
    }
  }

  return resultado;
}
