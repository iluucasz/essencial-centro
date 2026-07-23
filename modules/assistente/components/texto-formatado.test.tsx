import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TextoFormatado } from "./texto-formatado";

describe("TextoFormatado", () => {
  it("renderiza link markdown do cliente como nome clicável", () => {
    render(
      <TextoFormatado
        aoClicarLink={vi.fn()}
        ehUsuario={false}
        texto="Encontrei a cliente **[Thalia Eluan](/painel/clientes/deaf3c5f-e0cc-4002-ac4e-2ef75752ebd4)**."
      />,
    );

    const link = screen.getByRole("link", { name: "Thalia Eluan" });

    expect(link).toHaveAttribute("href", "/painel/clientes/deaf3c5f-e0cc-4002-ac4e-2ef75752ebd4");
    expect(screen.queryByText(/\[Thalia Eluan\]/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/painel\/clientes\//)).not.toBeInTheDocument();
  });

  it("renderiza títulos, tabelas e remove marcadores de citação (sem markdown cru)", () => {
    render(
      <TextoFormatado
        aoClicarLink={vi.fn()}
        ehUsuario={false}
        texto={[
          "## Achados por área【0†L1】",
          "| Marcador | Valor |",
          "|---|---|",
          "| Olhos | 5,813 |",
        ].join("\n")}
      />,
    );

    // título renderizado sem o "##" nem o marcador de citação
    expect(screen.getByText("Achados por área")).toBeInTheDocument();
    expect(screen.queryByText(/##/)).not.toBeInTheDocument();
    expect(screen.queryByText(/†/)).not.toBeInTheDocument();
    // tabela de verdade, não pipes crus
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Marcador" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Olhos" })).toBeInTheDocument();
    expect(screen.queryByText(/\|/)).not.toBeInTheDocument();
  });
});
