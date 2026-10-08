export const filtrosCliente = [
  "todos",
  "com-contato",
  "sem-contato",
  "com-objetivo",
  "sem-objetivo",
  "com-tag",
  "sem-tag",
] as const;

export type FiltroCliente = (typeof filtrosCliente)[number];

export function normalizarFiltroCliente(valor: string | undefined): FiltroCliente {
  return (filtrosCliente as readonly string[]).includes(valor ?? "")
    ? (valor as FiltroCliente)
    : "todos";
}

type ClienteParaFiltro = {
  email: string | null;
  telefone: string | null;
  objetivoTratamento: string | null;
  tag: string | null;
};

export function aplicarFiltroCliente<T extends ClienteParaFiltro>(
  clientes: T[],
  filtro: FiltroCliente,
): T[] {
  return clientes.filter((cliente) => {
    const temContato = Boolean(cliente.email || cliente.telefone);
    const temObjetivo = Boolean(cliente.objetivoTratamento?.trim());
    const temTag = Boolean(cliente.tag?.trim());

    if (filtro === "com-contato") return temContato;
    if (filtro === "sem-contato") return !temContato;
    if (filtro === "com-objetivo") return temObjetivo;
    if (filtro === "sem-objetivo") return !temObjetivo;
    if (filtro === "com-tag") return temTag;
    if (filtro === "sem-tag") return !temTag;

    return true;
  });
}

export function aplicarFiltroTagCliente<T extends Pick<ClienteParaFiltro, "tag">>(
  clientes: T[],
  tag: string | undefined,
) {
  const tagNormalizada = tag?.trim().toLocaleLowerCase("pt-BR");

  if (!tagNormalizada) return clientes;

  return clientes.filter(
    (cliente) => cliente.tag?.trim().toLocaleLowerCase("pt-BR") === tagNormalizada,
  );
}
