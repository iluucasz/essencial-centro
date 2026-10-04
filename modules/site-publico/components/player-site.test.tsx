import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filtrosMidia, type AjustesMidia } from "../validacao";
import { PlayerSite } from "./player-site";

const VIDEO = "https://loja.public.blob.vercel-storage.com/site-publico/video.mp4";
const MUSICA = "https://loja.public.blob.vercel-storage.com/site-publico/musica.mp3";
const padrao: AjustesMidia = {
  filtro: "original",
  somOriginal: true,
  musica: "",
  volumeMusica: 60,
};

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function audio() {
  return document.querySelector("audio")!;
}

describe("Player do site", () => {
  it("usa controles próprios, sem os do navegador, e aplica o filtro escolhido", () => {
    render(<PlayerSite midia={VIDEO} ajustes={{ ...padrao, filtro: "pb" }} rotulo="Vídeo" />);
    const video = screen.getByLabelText("Vídeo");
    expect(video).not.toHaveAttribute("controls");
    expect(video).toHaveAttribute("disablepictureinpicture");
    expect(video.style.filter).toBe(filtrosMidia.pb.css);
    expect(document.querySelector("audio")).toBeNull();
  });

  it("silencia o som original e toca a música junto com o vídeo", async () => {
    const user = userEvent.setup();
    render(
      <PlayerSite
        midia={VIDEO}
        ajustes={{ ...padrao, somOriginal: false, musica: MUSICA, volumeMusica: 40 }}
        rotulo="Vídeo"
      />,
    );
    const video = screen.getByLabelText<HTMLVideoElement>("Vídeo");
    expect(video.muted).toBe(true);
    expect(audio().volume).toBeCloseTo(0.4);
    expect(audio()).toHaveAttribute("loop");

    await user.click(screen.getByRole("button", { name: "Assistir: Vídeo" }));
    fireEvent.play(video);
    expect(play.mock.contexts).toContain(audio());

    fireEvent.pause(video);
    expect(pause.mock.contexts).toContain(audio());

    await user.click(screen.getByRole("button", { name: "Silenciar" }));
    expect(audio().muted).toBe(true);
  });

  it("mantém o som original quando configurado", () => {
    render(<PlayerSite midia={VIDEO} ajustes={padrao} rotulo="Vídeo" />);
    expect(screen.getByLabelText<HTMLVideoElement>("Vídeo").muted).toBe(false);
  });
});
