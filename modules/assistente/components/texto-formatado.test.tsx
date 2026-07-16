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
});
