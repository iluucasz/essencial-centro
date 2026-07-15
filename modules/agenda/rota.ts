export type ParadaRota = {
  endereco: string | null;
};

/**
 * Monta um link de rota multi-parada do Google Maps (deep link, sem chave de API — só
 * `dir/?api=1`) a partir dos endereços já cadastrados dos clientes, na ordem dos atendimentos.
 * Paradas sem endereço cadastrado são ignoradas; retorna `null` quando nenhuma parada tem
 * endereço (nada pra abrir).
 */
export function construirLinkRotaGoogleMaps(paradas: ParadaRota[]): string | null {
  const enderecos = paradas
    .map((parada) => parada.endereco?.trim())
    .filter((endereco): endereco is string => Boolean(endereco));

  if (enderecos.length === 0) return null;

  const destino = enderecos[enderecos.length - 1]!;
  const waypoints = enderecos.slice(0, -1);

  const params = new URLSearchParams({ api: "1", destination: destino });
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
