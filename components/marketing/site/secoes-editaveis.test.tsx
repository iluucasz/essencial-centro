import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  blocoContatoPadrao,
  blocoJornadaPadrao,
  blocoLoginPadrao,
  blocoRodapePadrao,
  blocoSobrePadrao,
  numeroWhatsapp,
} from "@/modules/site-publico/blocos";
import { AboutSection } from "./about-section";
import { ContactSection } from "./contact-section";
import { HeroSection } from "./hero-section";
import { JourneySection } from "./journey-section";
import { PortalSection } from "./portal-section";
import { SiteFooter } from "./site-footer";

afterEach(cleanup);

const contato = {
  ...blocoContatoPadrao,
  telefone: "(21) 98888-7777",
  instagram: "@nova.conta",
  email: "",
  horario: "Seg a sex, 9h às 18h",
};

describe("Seções editáveis do site", () => {
  it("normaliza o telefone para o formato do WhatsApp", () => {
    expect(numeroWhatsapp("(21) 98888-7777")).toBe("5521988887777");
    expect(numeroWhatsapp("+55 21 99253-1805")).toBe("5521992531805");
  });

  it("o telefone editado vira o destino de todos os botões de WhatsApp", () => {
    render(
      <>
        <HeroSection whatsapp={numeroWhatsapp(contato.telefone)} />
        <ContactSection conteudo={contato} />
        <SiteFooter contato={contato} conteudo={blocoRodapePadrao} />
      </>,
    );
    const destinos = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("https://wa.me/"));
    expect(destinos.length).toBeGreaterThanOrEqual(4);
    for (const destino of destinos) expect(destino).toContain("wa.me/5521988887777");
    expect(screen.getByText("Seg a sex, 9h às 18h")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "@nova.conta" })[0].getAttribute("href")).toBe(
      "https://www.instagram.com/nova.conta/",
    );
    expect(screen.queryByText("E-mail")).not.toBeInTheDocument();
  });

  it("como funciona numera os passos editados e mostra os diferenciais", () => {
    render(
      <JourneySection
        conteudo={{
          ...blocoJornadaPadrao,
          passos: [
            { titulo: "Primeiro contato", descricao: "Conversa inicial." },
            { titulo: "Avaliação", descricao: "Entendemos o seu caso." },
          ],
          diferenciais: [],
        }}
      />,
    );
    const passos = screen.getAllByRole("listitem");
    expect(passos).toHaveLength(2);
    expect(within(passos[1]).getByText("02")).toBeVisible();
    expect(within(passos[1]).getByRole("heading", { name: "Avaliação" })).toBeVisible();
  });

  it("sobre esconde a assinatura quando não há responsável", () => {
    render(
      <AboutSection conteudo={{ ...blocoSobrePadrao, nomeResponsavel: "", destaques: ["Um"] }} />,
    );
    expect(screen.queryByText(blocoSobrePadrao.cargoResponsavel)).not.toBeInTheDocument();
    expect(screen.getByText("Um")).toBeVisible();
  });

  it("login mostra os textos editados e mantém os botões na tela de entrar", () => {
    render(
      <PortalSection
        conteudo={{
          ...blocoLoginPadrao,
          cliente: { ...blocoLoginPadrao.cliente, botao: "Entrar no portal" },
        }}
      />,
    );
    expect(screen.getByRole("link", { name: /Entrar no portal/ })).toHaveAttribute(
      "href",
      "/entrar",
    );
  });
});
