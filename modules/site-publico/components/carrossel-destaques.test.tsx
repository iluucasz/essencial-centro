import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CarrosselDestaques } from "./carrossel-destaques";
import { SecaoDepoimentos, SecaoProfissionais } from "./secoes-institucionais";
import { destaquePadrao, type ConteudoPublico } from "../validacao";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const itens: ConteudoPublico[] = [
  destaquePadrao,
  {
    ...destaquePadrao,
    id: "video",
    titulo: "Vídeo de apresentação",
    tipoMidia: "video",
    midia: "/images/apresentacao.mp4",
  },
  { ...destaquePadrao, id: "imagem", titulo: "Nosso espaço" },
];

describe("Carrossel principal", () => {
  it("mostra só a foto padrão, sem navegação, enquanto nada foi publicado", () => {
    render(<CarrosselDestaques itens={[]} />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", destaquePadrao.titulo);
    expect(screen.queryByRole("button", { name: "Próxima mídia" })).not.toBeInTheDocument();
  });

  it("navega em imagens e vídeos pelas setas, bolinhas e teclado", () => {
    render(<CarrosselDestaques itens={itens} />);
    fireEvent.click(screen.getByRole("button", { name: "Próxima mídia" }));
    expect(
      screen.getByRole("button", { name: "Assistir: Vídeo de apresentação" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Vídeo de apresentação")).not.toHaveAttribute("autoplay");
    expect(screen.getByLabelText("Vídeo de apresentação")).not.toHaveAttribute("controls");
    expect(screen.getByLabelText("Vídeo de apresentação")).toHaveAttribute(
      "disablepictureinpicture",
    );
    fireEvent.click(screen.getByRole("button", { name: "Ver mídia 3: Nosso espaço" }));
    expect(screen.getByRole("img", { name: "Nosso espaço" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(screen.getByRole("img")).toHaveAttribute("alt", destaquePadrao.titulo);
  });

  it("troca após cinco segundos, respeita pausa e não interrompe vídeo tocando", () => {
    vi.useFakeTimers();
    render(<CarrosselDestaques itens={itens} />);
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.queryByLabelText("Vídeo de apresentação")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    const video = screen.getByLabelText("Vídeo de apresentação");
    fireEvent.play(video);
    act(() => vi.advanceTimersByTime(20000));
    expect(video).toBeInTheDocument();
    fireEvent.ended(video);
    expect(screen.getByRole("img", { name: "Nosso espaço" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Pausar carrossel" }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole("img", { name: "Nosso espaço" })).toBeVisible();
  });

  it("aceita qualquer quantidade de itens sem limitar os indicadores", () => {
    render(
      <CarrosselDestaques
        itens={Array.from({ length: 15 }, (_, index) => ({
          ...destaquePadrao,
          id: String(index),
          titulo: `Foto ${index}`,
        }))}
      />,
    );
    expect(screen.getAllByRole("button", { name: /^Ver mídia/ })).toHaveLength(15);
  });
});

describe("Depoimentos e profissionais", () => {
  it("não exibe depoimentos nem profissionais inventados quando nada foi publicado", () => {
    const { container } = render(
      <>
        <SecaoDepoimentos itens={[]} />
        <SecaoProfissionais itens={[]} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("apresenta os relatos e profissionais publicados", () => {
    render(
      <>
        <SecaoDepoimentos
          itens={[
            {
              ...destaquePadrao,
              midia: "",
              tipo: "depoimento",
              titulo: "Cliente de teste",
              texto: "Relato usado apenas no teste.",
              nota: 4,
            },
          ]}
        />
        <SecaoProfissionais
          itens={[
            {
              ...destaquePadrao,
              tipo: "profissional",
              titulo: "Profissional de teste",
              subtitulo: "Especialidade de teste",
            },
          ]}
        />
      </>,
    );
    expect(screen.getByText("“Relato usado apenas no teste.”")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Avaliação: 4 de 5 estrelas" })).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Profissional de teste" })).toBeInTheDocument();
  });
});
