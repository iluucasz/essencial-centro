import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ServicesSection } from "./services-section";
import { ContactSection } from "./contact-section";
import { CLINIC, SERVICES } from "@/lib/marketing/clinic";

afterEach(cleanup);

describe("Catálogo público da Essencial", () => {
  it("permite consultar as sete categorias sem login e encaminha o serviço escolhido", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    const categorias = screen.getByRole("group", { name: "Categorias de atendimento" });
    expect(within(categorias).getAllByRole("button")).toHaveLength(7);
    for (const servico of SERVICES) {
      const botao = within(categorias).getByRole("button", { name: servico.name });
      await user.click(botao);
      expect(botao).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: servico.name })).toBeVisible();
      for (const tratamento of servico.treatments)
        expect(screen.getByText(tratamento)).toBeVisible();
      const destino = new URL(
        screen.getByRole("link", { name: /^Conversar sobre/ }).getAttribute("href")!,
      );
      expect(destino.origin + destino.pathname).toBe(`https://wa.me/${CLINIC.whatsapp}`);
      expect(destino.searchParams.get("text")).toContain(servico.name);
    }
  });

  it("expande o catálogo e fecha as artes ao mudar de atendimento", async () => {
    const user = userEvent.setup();
    render(<ServicesSection />);
    const abrir = screen.getByText("Ver páginas do catálogo e valores");
    await user.click(abrir);
    expect(abrir.closest("details")).toHaveAttribute("open");
    await user.click(screen.getByRole("button", { name: "Estética facial" }));
    expect(
      screen.getByText("Ver páginas do catálogo e valores").closest("details"),
    ).not.toHaveAttribute("open");
    expect(screen.queryByRole("heading", { name: "Estética corporal" })).not.toBeInTheDocument();
  });

  it("oferece uma mensagem revisável sem fingir envio nem coletar dados clínicos", async () => {
    const user = userEvent.setup();
    render(<ContactSection />);
    await user.selectOptions(screen.getByRole("combobox"), "Podologia");
    const link = screen.getByRole("link", { name: "Continuar no WhatsApp" });
    expect(new URL(link.getAttribute("href")!).searchParams.get("text")).toContain("Podologia");
    expect(screen.queryByText("Recebemos seu pedido")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
