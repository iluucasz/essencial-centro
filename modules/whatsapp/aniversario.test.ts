import { describe, expect, it } from "vitest";

import { devDispararAutomaticamente, ehAniversarioHoje, mensagemAniversario } from "./aniversario";

describe("ehAniversarioHoje", () => {
  it("reconhece o aniversário quando mês e dia batem, independente do ano de nascimento", () => {
    const nascimento = new Date("1990-05-20T00:00:00.000Z");
    const hoje = new Date("2026-05-20T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, hoje)).toBe(true);
  });

  it("não reconhece em outro dia", () => {
    const nascimento = new Date("1990-05-20T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, new Date("2026-05-21T00:00:00.000Z"))).toBe(false);
    expect(ehAniversarioHoje(nascimento, new Date("2026-06-20T00:00:00.000Z"))).toBe(false);
  });

  it("29/fev cai certinho em ano bissexto", () => {
    const nascimento = new Date("1996-02-29T00:00:00.000Z");
    const hoje = new Date("2028-02-29T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, hoje)).toBe(true);
  });

  it("29/fev é comemorado em 28/fev nos anos não bissextos — senão nunca dispararia", () => {
    const nascimento = new Date("1996-02-29T00:00:00.000Z");
    const hoje = new Date("2026-02-28T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, hoje)).toBe(true);
  });

  it("28/fev normal (quem nasceu em 28/fev) não é afetado pela regra do 29/fev", () => {
    const nascimento = new Date("1990-02-28T00:00:00.000Z");
    const hoje = new Date("2026-02-28T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, hoje)).toBe(true);
  });

  it("não comemora 29/fev em 1/mar de ano não bissexto — só em 28/fev", () => {
    const nascimento = new Date("1996-02-29T00:00:00.000Z");
    const hoje = new Date("2026-03-01T00:00:00.000Z");

    expect(ehAniversarioHoje(nascimento, hoje)).toBe(false);
  });
});

describe("mensagemAniversario", () => {
  it("cumprimenta pelo primeiro nome", () => {
    const mensagem = mensagemAniversario({ primeiroNome: "Natalia" });

    expect(mensagem).toContain("Feliz aniversário, Natalia!");
  });

  it("inclui o brinde quando informado", () => {
    const mensagem = mensagemAniversario({
      primeiroNome: "Natalia",
      brinde: "10% de desconto numa sessão à sua escolha",
    });

    expect(mensagem).toContain("10% de desconto numa sessão à sua escolha");
    expect(mensagem.toLowerCase()).toContain("presente");
  });

  it("não menciona presente/brinde quando não há nenhum cadastrado", () => {
    const semBrinde = mensagemAniversario({ primeiroNome: "Natalia" });
    const brindeVazio = mensagemAniversario({ primeiroNome: "Natalia", brinde: null });

    expect(semBrinde.toLowerCase()).not.toContain("presente");
    expect(brindeVazio.toLowerCase()).not.toContain("presente");
  });
});

describe("devDispararAutomaticamente", () => {
  const hoje = new Date("2026-08-28T13:00:00.000Z");

  it("não dispara quando a automação está desativada", () => {
    expect(
      devDispararAutomaticamente({ ativo: false, ultimoDisparoAutomaticoEm: null }, hoje),
    ).toBe(false);
  });

  it("dispara quando ativa e nunca rodou antes", () => {
    expect(devDispararAutomaticamente({ ativo: true, ultimoDisparoAutomaticoEm: null }, hoje)).toBe(
      true,
    );
  });

  it("não dispara de novo se já rodou hoje, mesmo em outro horário", () => {
    const rodouDeManha = new Date("2026-08-28T09:00:00.000Z");

    expect(
      devDispararAutomaticamente({ ativo: true, ultimoDisparoAutomaticoEm: rodouDeManha }, hoje),
    ).toBe(false);
  });

  it("dispara de novo se a última execução foi em outro dia", () => {
    const rodouOntem = new Date("2026-08-27T09:00:00.000Z");

    expect(
      devDispararAutomaticamente({ ativo: true, ultimoDisparoAutomaticoEm: rodouOntem }, hoje),
    ).toBe(true);
  });
});
