import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CampoModelo } from "@/modules/fichas/campos";

import { FormularioDinamico } from "./formulario-dinamico";

const campos: CampoModelo[] = [
  { id: "sec", tipo: "secao", rotulo: "Dados", obrigatorio: false, quemPreenche: "cliente" },
  {
    id: "queixa",
    tipo: "texto_curto",
    rotulo: "Queixa principal",
    obrigatorio: true,
    quemPreenche: "cliente",
  },
  {
    id: "cirurgia",
    tipo: "sim_nao",
    rotulo: "Fez cirurgia?",
    obrigatorio: false,
    detalheSeSim: true,
    quemPreenche: "cliente",
  },
];

describe("FormularioDinamico", () => {
  it("renderiza seção e campos do modelo", () => {
    render(<FormularioDinamico aoEnviar={vi.fn()} campos={campos} />);

    expect(screen.getByText("Dados")).toBeInTheDocument();
    expect(screen.getByText("Queixa principal")).toBeInTheDocument();
  });

  it("bloqueia o envio com campo obrigatório vazio e envia quando preenchido", async () => {
    const aoEnviar = vi.fn().mockResolvedValue({ status: "sucesso" });

    render(<FormularioDinamico aoEnviar={aoEnviar} campos={campos} rotuloEnviar="Salvar ficha" />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar ficha" }));

    expect(await screen.findByText("Campo obrigatório.")).toBeInTheDocument();
    expect(aoEnviar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Dor lombar" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar ficha" }));

    await waitFor(() => expect(aoEnviar).toHaveBeenCalledTimes(1));
    expect(aoEnviar.mock.calls[0][0].respostas).toMatchObject({ queixa: "Dor lombar" });
  });

  it("mostra o campo de detalhe do sim/não só quando 'Sim' é marcado", async () => {
    render(<FormularioDinamico aoEnviar={vi.fn()} campos={campos} />);

    expect(screen.queryByPlaceholderText("Detalhe")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Sim" }));

    expect(await screen.findByPlaceholderText("Detalhe")).toBeInTheDocument();
  });
});
