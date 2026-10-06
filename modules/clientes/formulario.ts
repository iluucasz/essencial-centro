/** Leitura do FormData do cadastro de cliente — compartilhada pelo painel e pelo link público. */
export function checkboxAtivo(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function lerFormularioCliente(formData: FormData) {
  return {
    nome: formData.get("nome"),
    dataNascimento: formData.get("dataNascimento"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    endereco: formData.get("endereco"),
    contatoEmergenciaNome: formData.get("contatoEmergenciaNome"),
    contatoEmergenciaTelefone: formData.get("contatoEmergenciaTelefone"),
    profissao: formData.get("profissao"),
    peso: formData.get("peso"),
    altura: formData.get("altura"),
    queixas: formData.get("queixas"),
    objetivoTratamento: formData.get("objetivoTratamento"),
    alergias: formData.get("alergias"),
    medicamentos: formData.get("medicamentos"),
    condicoesSaude: formData.get("condicoesSaude"),
    cirurgias: formData.get("cirurgias"),
    contraindicacoes: formData.get("contraindicacoes"),
    consentimentoDados: checkboxAtivo(formData.get("consentimentoDados")),
    consentimentoImagem: checkboxAtivo(formData.get("consentimentoImagem")),
    observacoesInternas: formData.get("observacoesInternas"),
  };
}
