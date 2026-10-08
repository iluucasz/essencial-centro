export type ClienteFiltravelCampanha = {
  nome: string;
  tag: string | null;
};

/** Busca local do seletor: a tag operacional funciona como agrupador sem ocultar clientes sem tag. */
export function filtrarClientesCampanha<T extends ClienteFiltravelCampanha>(
  clientes: T[],
  busca: string,
) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");

  if (!termo) return clientes;

  return clientes.filter(
    (cliente) =>
      cliente.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
      cliente.tag?.toLocaleLowerCase("pt-BR").includes(termo),
  );
}

export type GrupoClientesTag<T> = {
  tag: string;
  clientes: T[];
};

/** Agrupa apenas clientes com tag, preservando a grafia e ordenando para o seletor de campanha. */
export function agruparClientesPorTag<T extends ClienteFiltravelCampanha>(
  clientes: T[],
): GrupoClientesTag<T>[] {
  const grupos = new Map<string, GrupoClientesTag<T>>();

  for (const cliente of clientes) {
    const tag = cliente.tag?.trim();
    if (!tag) continue;

    const chave = tag.toLocaleLowerCase("pt-BR");
    const grupo = grupos.get(chave) ?? { tag, clientes: [] };
    grupo.clientes.push(cliente);
    grupos.set(chave, grupo);
  }

  return Array.from(grupos.values()).sort((a, b) => a.tag.localeCompare(b.tag, "pt-BR"));
}
