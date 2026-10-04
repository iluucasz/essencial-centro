import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { destaquePadrao, type ConteudoPublico } from "../validacao";
import { CarrosselProfissionais } from "./profissionais";

afterEach(cleanup);

function profissional(titulo: string, subtitulo: string): ConteudoPublico {
  return {
    ...destaquePadrao,
    id: titulo,
    tipo: "profissional",
    titulo,
    subtitulo,
    texto: `Apresentação de ${titulo}.`,
  };
}

const itens = [
  profissional("Edvania Crespo", "Terapeuta Ortomolecular"),
  profissional("Dr Edmo", "Oncologia e saúde mental"),
  profissional("Ana Carolina", "Podologia"),
];

describe("Profissionais em leque", () => {
  it("mostra os cards em leque e os detalhes do profissional da frente", () => {
    render(<CarrosselProfissionais itens={itens} whatsapp="5521992531805" />);
    // Cards de trás ficam fora da árvore acessível (só o da frente é anunciado).
    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(3);
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Edvania Crespo", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Apresentação de Edvania Crespo.")).toBeInTheDocument();
    const agendar = screen.getByRole("link", { name: /Agendar com Edvania Crespo/ });
    const destino = new URL(agendar.getAttribute("href")!);
    expect(destino.pathname).toBe("/5521992531805");
    expect(destino.searchParams.get("text")).toContain("Edvania Crespo");
  });

  it("troca o profissional pelas setas, bolinhas, clique no card de trás e teclado", async () => {
    const user = userEvent.setup();
    render(<CarrosselProfissionais itens={itens} whatsapp="5521992531805" />);

    await user.click(screen.getByRole("button", { name: "Próximo" }));
    expect(screen.getByRole("heading", { name: "Dr Edmo", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Dr Edmo" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Ver Ana Carolina" }));
    expect(screen.getByRole("heading", { name: "Ana Carolina", level: 3 })).toBeInTheDocument();

    // Ciclo: depois do último vem o primeiro.
    await user.click(screen.getByRole("button", { name: "Próximo" }));
    expect(screen.getByRole("heading", { name: "Edvania Crespo", level: 3 })).toBeInTheDocument();

    // Card de trás é aria-hidden (sem nome acessível): localiza pelo rótulo do slide.
    const cardDeTras = () => document.querySelector<HTMLElement>('[aria-label="2 de 3: Dr Edmo"]')!;
    fireEvent.click(cardDeTras());
    expect(screen.getByRole("heading", { name: "Dr Edmo", level: 3 })).toBeInTheDocument();

    fireEvent.keyDown(cardDeTras(), { key: "ArrowLeft" });
    expect(screen.getByRole("heading", { name: "Edvania Crespo", level: 3 })).toBeInTheDocument();
  });

  it("um único profissional não mostra navegação", () => {
    render(<CarrosselProfissionais itens={itens.slice(0, 1)} whatsapp="5521992531805" />);
    expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
  });
});
