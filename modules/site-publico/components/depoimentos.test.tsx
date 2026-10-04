import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConteudoPublico } from "../validacao";
import { SecaoDepoimentos } from "./depoimentos";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function depoimento(dados: Partial<ConteudoPublico>): ConteudoPublico {
  return {
    id: crypto.randomUUID(),
    tipo: "depoimento",
    titulo: "Cliente de teste",
    subtitulo: "Ozonioterapia",
    texto: "Relato usado apenas no teste.",
    tipoMidia: "imagem",
    midia: "",
    filtro: "original",
    somOriginal: true,
    musica: "",
    volumeMusica: 60,
    ordem: 0,
    nota: 5,
    ...dados,
  };
}

describe("Depoimentos no site", () => {
  it("não aparece sem depoimentos publicados", () => {
    const { container } = render(<SecaoDepoimentos itens={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra até três depoimentos e avança um por vez, em ciclo", async () => {
    const user = userEvent.setup();
    render(
      <SecaoDepoimentos
        itens={["Ana", "Bia", "Clara", "Dora"].map((titulo) =>
          depoimento({ titulo, texto: `Relato de ${titulo}.` }),
        )}
      />,
    );
    const ordem = () =>
      screen.getAllByRole("group").map((slide) => slide.getAttribute("aria-label"));
    expect(ordem()).toEqual(["Depoimento 1 de 4", "Depoimento 2 de 4", "Depoimento 3 de 4"]);
    // Celular mostra só o primeiro; tablet e desktop revelam o 2º e o 3º.
    const [primeiro, segundo, terceiro] = screen.getAllByRole("group");
    expect(primeiro).not.toHaveClass("hidden");
    expect(segundo).toHaveClass("hidden", "md:flex");
    expect(terceiro).toHaveClass("hidden", "lg:flex");

    await user.click(screen.getByRole("button", { name: "Próximo depoimento" }));
    expect(ordem()).toEqual(["Depoimento 2 de 4", "Depoimento 3 de 4", "Depoimento 4 de 4"]);
    await user.click(screen.getByRole("button", { name: "Ver depoimento 4" }));
    expect(ordem()).toEqual(["Depoimento 4 de 4", "Depoimento 1 de 4", "Depoimento 2 de 4"]);
    const regiao = screen.getByRole("region", { name: "Depoimentos dos clientes" });
    fireEvent.touchStart(regiao, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(regiao, { changedTouches: [{ clientX: 80, clientY: 105 }] });
    expect(ordem()[0]).toBe("Depoimento 1 de 4");
    expect(screen.getByText("“Relato de Ana.”")).toBeInTheDocument();
  });

  it("esconde a navegação quando todos os depoimentos cabem na tela", () => {
    render(<SecaoDepoimentos itens={[depoimento({}), depoimento({}), depoimento({})]} />);
    expect(screen.getByRole("button", { name: "Próximo depoimento" }).parentElement).toHaveClass(
      "lg:hidden",
    );
  });

  it("um único depoimento não mostra navegação", () => {
    render(<SecaoDepoimentos itens={[depoimento({})]} />);
    expect(screen.getByRole("button", { name: "Próximo depoimento" }).parentElement).toHaveClass(
      "hidden",
    );
  });

  it("vídeo abre como capa com play e só mostra os controles ao assistir", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const user = userEvent.setup();
    render(
      <SecaoDepoimentos
        itens={[
          depoimento({
            titulo: "Dona Luzia",
            tipoMidia: "video",
            midia: "https://loja.public.blob.vercel-storage.com/site-publico/luzia.mp4",
          }),
        ]}
      />,
    );
    const video = screen.getByLabelText("Depoimento em vídeo de Dona Luzia");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("controls");
    expect(video).toHaveAttribute("disablepictureinpicture");

    await user.click(
      screen.getByRole("button", { name: "Assistir: Depoimento em vídeo de Dona Luzia" }),
    );
    expect(play).toHaveBeenCalled();
    fireEvent.play(video);
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assistir/ })).not.toBeInTheDocument();

    fireEvent.ended(video);
    expect(screen.getByRole("button", { name: /Assistir/ })).toBeInTheDocument();
  });

  it("depoimento em texto exibe relato, nota e autor", () => {
    render(<SecaoDepoimentos itens={[depoimento({ nota: 4 })]} />);
    expect(screen.getByText("“Relato usado apenas no teste.”")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avaliação: 4 de 5 estrelas" })).toBeInTheDocument();
    expect(screen.getByText("Cliente de teste")).toBeInTheDocument();
  });
});
