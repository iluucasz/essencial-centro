export type CamposEnderecoCliente = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const ufsBrasil = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export function criarEnderecoVazio(): CamposEnderecoCliente {
  return {
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  };
}

export function normalizarCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatarCep(value: string) {
  const cep = normalizarCep(value);

  if (cep.length <= 5) return cep;

  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
}

function limpar(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function montarEnderecoCliente(campos: CamposEnderecoCliente) {
  const cep = formatarCep(campos.cep);
  const logradouro = limpar(campos.logradouro);
  const numero = limpar(campos.numero);
  const complemento = limpar(campos.complemento);
  const bairro = limpar(campos.bairro);
  const cidade = limpar(campos.cidade);
  const uf = limpar(campos.uf).toUpperCase();

  const enderecoNumero = [logradouro, numero].filter(Boolean).join(", ");
  const enderecoCompleto = [enderecoNumero, complemento].filter(Boolean).join(", ");
  const cidadeUf = cidade && uf ? `${cidade}/${uf}` : cidade || uf;

  return [enderecoCompleto, bairro, cidadeUf, cep ? `CEP ${cep}` : ""].filter(Boolean).join(" - ");
}

export function extrairEnderecoCliente(endereco: string | null | undefined): CamposEnderecoCliente {
  const vazio = criarEnderecoVazio();
  const texto = endereco?.trim();

  if (!texto) return vazio;

  const cepEncontrado = texto.match(/(?:CEP\s*)?(\d{5}-?\d{3})/i)?.[1] ?? "";
  const cep = formatarCep(cepEncontrado);
  const semCep = texto.replace(/\s*-?\s*CEP\s*\d{5}-?\d{3}\s*$/i, "").trim();
  const partes = semCep
    .split(/\s+-\s+/)
    .map((parte) => parte.trim())
    .filter(Boolean);

  const linhaEndereco = partes[0] ?? semCep;
  const partesEndereco = linhaEndereco
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);
  const localidade = partes[2] ?? "";
  const localidadeMatch = localidade.match(/^(.*?)(?:\/|\s-\s)([A-Z]{2})$/i);
  const uf = localidadeMatch?.[2]?.toUpperCase() ?? "";
  const cidade = localidadeMatch?.[1]?.trim() ?? localidade;

  return {
    cep,
    logradouro: partesEndereco[0] ?? "",
    numero: partesEndereco[1] ?? "",
    complemento: partesEndereco.slice(2).join(", "),
    bairro: partes[1] ?? "",
    cidade,
    uf: ufsBrasil.includes(uf as (typeof ufsBrasil)[number]) ? uf : "",
  };
}
