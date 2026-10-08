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
