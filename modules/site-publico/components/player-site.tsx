"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { filtrosMidia, type AjustesMidia } from "../validacao";

function formatarTempo(segundos: number) {
  if (!Number.isFinite(segundos)) return "0:00";
  const inteiro = Math.floor(segundos);
  return `${Math.floor(inteiro / 60)}:${String(inteiro % 60).padStart(2, "0")}`;
}

/**
 * Player dos vídeos do site com controles próprios: sem menu "Baixar"/picture-in-picture em
 * nenhum navegador, e com os ajustes salvos no conteúdo aplicados na exibição — filtro CSS, som
 * original desligado e música de fundo tocando em sincronia (play, pausa, avanço e fim).
 */
export function PlayerSite({
  midia,
  ajustes,
  rotulo,
  ajuste = "cobrir",
  capa,
  aoMudarReproducao,
  aoTerminar,
}: {
  midia: string;
  ajustes: AjustesMidia;
  rotulo: string;
  /** `cobrir` preenche o quadro (vídeo vertical em card vertical); `conter` mostra inteiro. */
  ajuste?: "cobrir" | "conter";
  /** Conteúdo decorativo sobre o vídeo antes do primeiro play (o botão de play é do player). */
  capa?: ReactNode;
  aoMudarReproducao?: (tocando: boolean) => void;
  aoTerminar?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const [iniciado, setIniciado] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [paisagem, setPaisagem] = useState(false);

  useEffect(() => {
    if (video.current) video.current.muted = mudo || !ajustes.somOriginal;
    if (audio.current) {
      audio.current.muted = mudo;
      audio.current.volume = ajustes.volumeMusica / 100;
    }
  }, [mudo, ajustes.somOriginal, ajustes.volumeMusica]);

  function sincronizarMusica() {
    const musica = audio.current;
    const atual = video.current;
    if (!musica || !atual || !Number.isFinite(musica.duration) || musica.duration === 0) return;
    musica.currentTime = atual.currentTime % musica.duration;
  }

  function tocar() {
    void video.current?.play();
  }

  function alternar() {
    if (video.current?.paused) tocar();
    else video.current?.pause();
  }

  function mudarReproducao(valor: boolean) {
    setTocando(valor);
    aoMudarReproducao?.(valor);
  }

  return (
    <div ref={quadro} className="group/player relative size-full bg-foreground">
      <video
        ref={video}
        // `#t=0.1` faz o Safari mostrar o primeiro quadro como capa, sem baixar o vídeo inteiro.
        src={`${midia}#t=0.1`}
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={rotulo}
        onContextMenu={(evento) => evento.preventDefault()}
        onClick={alternar}
        onLoadedMetadata={(evento) => {
          setDuracao(evento.currentTarget.duration);
          setPaisagem(evento.currentTarget.videoWidth > evento.currentTarget.videoHeight);
        }}
        onTimeUpdate={(evento) => setTempo(evento.currentTarget.currentTime)}
        onPlay={() => {
          setIniciado(true);
          mudarReproducao(true);
          sincronizarMusica();
          void audio.current?.play().catch(() => {});
        }}
        onPause={() => {
          mudarReproducao(false);
          audio.current?.pause();
        }}
        onSeeked={sincronizarMusica}
        onEnded={() => {
          setIniciado(false);
          mudarReproducao(false);
          audio.current?.pause();
          aoTerminar?.();
        }}
        style={{ filter: filtrosMidia[ajustes.filtro].css }}
        className={`size-full ${ajuste === "conter" || paisagem ? "object-contain" : "object-cover"}`}
      >
        Seu navegador não suporta vídeo.
      </video>
      {ajustes.musica && <audio ref={audio} src={ajustes.musica} loop preload="none" />}

      {!iniciado && capa}
      {!tocando && (
        <button
          type="button"
          aria-label={`Assistir: ${rotulo}`}
          onClick={tocar}
          className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand shadow-lg transition hover:scale-105 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
        >
          <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
        </button>
      )}
      {(iniciado || !capa) && (
        <>
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-t from-foreground/80 to-transparent px-3 pt-8 pb-3 text-white transition-opacity ${tocando ? "opacity-0 group-focus-within/player:opacity-100 group-hover/player:opacity-100" : "opacity-100"}`}
          >
            <button
              type="button"
              aria-label={tocando ? "Pausar" : "Reproduzir"}
              onClick={alternar}
              className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            >
              {tocando ? (
                <Pause className="size-4 fill-current" aria-hidden="true" />
              ) : (
                <Play className="size-4 fill-current" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              aria-label="Posição do vídeo"
              min={0}
              max={duracao || 0}
              step={0.1}
              value={tempo}
              onChange={(evento) => {
                if (video.current) video.current.currentTime = Number(evento.target.value);
              }}
              className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
            />
            <span className="shrink-0 text-xs tabular-nums">
              {formatarTempo(tempo)} / {formatarTempo(duracao)}
            </span>
            <button
              type="button"
              aria-label={mudo ? "Ativar som" : "Silenciar"}
              onClick={() => setMudo(!mudo)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            >
              {mudo ? (
                <VolumeX className="size-4" aria-hidden="true" />
              ) : (
                <Volume2 className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Tela cheia"
              onClick={() => void quadro.current?.requestFullscreen?.().catch(() => {})}
              className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Maximize className="size-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
