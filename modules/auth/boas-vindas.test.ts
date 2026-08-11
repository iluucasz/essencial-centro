import { describe, expect, it } from "vitest";

import { mensagemBoasVindasPortal } from "./boas-vindas";

describe("mensagemBoasVindasPortal", () => {
  const mensagem = mensagemBoasVindasPortal({
    primeiroNome: "Lucas",
    email: "lucas@example.com",
    senhaProvisoria: "VXVr9RHCnP",
    url: "https://essencial-centro.vercel.app/entrar",
  });

  it("dá os parabéns e diz que o cadastro deu certo", () => {
    expect(mensagem).toContain("Parabéns, Lucas");
    expect(mensagem.toLowerCase()).toContain("cadastro");
    expect(mensagem.toLowerCase()).toContain("sucesso");
  });

  it("inclui e-mail, senha provisória e o link de entrada", () => {
    expect(mensagem).toContain("lucas@example.com");
    expect(mensagem).toContain("VXVr9RHCnP");
    expect(mensagem).toContain("https://essencial-centro.vercel.app/entrar");
  });

  it("lista benefícios da plataforma — é o gancho pedido, não só a credencial", () => {
    expect(mensagem.toLowerCase()).toContain("atendimento");
    expect(mensagem.toLowerCase()).toContain("lembrete");
  });

  it("avisa que a senha provisória será trocada na primeira entrada", () => {
    expect(mensagem.toLowerCase()).toContain("primeira entrada");
  });
});
