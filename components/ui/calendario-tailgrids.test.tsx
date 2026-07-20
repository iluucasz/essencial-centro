import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CampoDataCalendario } from "./calendario-tailgrids";

describe("CampoDataCalendario", () => {
  it("permite escolher ano e mês sem navegar mês a mês", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CampoDataCalendario
        defaultValue="2024-03-20"
        label="Data de nascimento"
        name="dataNascimento"
        required
      />,
    );

    await user.click(screen.getByLabelText("Data de nascimento"));
    await user.click(screen.getByRole("button", { name: /março de 2024/i }));
    await user.selectOptions(screen.getByLabelText("Ano"), "1999");
    await user.click(screen.getByRole("button", { name: /^março$/i }));
    await user.click(screen.getByRole("button", { name: /^15$/ }));

    const valorFormulario = container.querySelector<HTMLInputElement>(
      'input[name="dataNascimento"]',
    );

    expect(valorFormulario).toHaveValue("1999-03-15");
  });
});
