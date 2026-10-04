"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { ImagePlus, LoaderCircle, Music, Send, Star, Trash2 } from "lucide-react";
import { salvarConteudoSite } from "../actions";
import type { ConteudoSite } from "../schema";
import {
  filtrosMidia,
  limiteArquivoSite,
  nomesFiltro,
  secoesConteudo,
  tiposArquivoSite,
  tiposAudioSite,
  type AjustesMidia,
  type FiltroMidia,
  type TipoConteudo,
} from "../validacao";
import { PlayerSite } from "./player-site";

const campo =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20";

const extensoes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
};

export async function enviarParaSite(arquivo: File, aoProgredir: (percentual: number) => void) {
  const blob = await upload(
    `site-publico/${crypto.randomUUID()}.${extensoes[arquivo.type]}`,
    arquivo,
    {
      access: "public",
      handleUploadUrl: "/api/site/upload",
      multipart: true,
      clientPayload: "publicacao-autorizada",
      onUploadProgress: ({ percentage }) => aoProgredir(Math.round(percentage)),
    },
  );
  return blob.url;
}

export function FormularioConteudo({
  tipo,
  item,
  aoConcluir,
}: {
  tipo: TipoConteudo;
  item?: ConteudoSite;
  aoConcluir: (mensagem: string) => void;
}) {
  const secao = secoesConteudo[tipo];
  const [titulo, setTitulo] = useState(item?.titulo ?? "");
  const [subtitulo, setSubtitulo] = useState(item?.subtitulo ?? "");
  const [texto, setTexto] = useState(item?.texto ?? "");
  const [nota, setNota] = useState<number | null>(item?.nota ?? null);
  const [midia, setMidia] = useState(item?.midia ?? "");
  const [tipoMidia, setTipoMidia] = useState<"imagem" | "video">(item?.tipoMidia ?? "imagem");
  const [ajustes, setAjustes] = useState<AjustesMidia>({
    filtro: item?.filtro ?? "original",
    somOriginal: item?.somOriginal ?? true,
    musica: item?.musica ?? "",
    volumeMusica: item?.volumeMusica ?? 60,
  });
  const [autorizado, setAutorizado] = useState(item?.autorizacaoPublicacao ?? false);
  const [progresso, setProgresso] = useState<{ alvo: "midia" | "musica"; valor: number }>();
  const [erro, setErro] = useState("");
  const [salvando, iniciarSalvamento] = useTransition();
  const ocupado = progresso !== undefined || salvando;
  const video = midia && tipoMidia === "video";

  function ajustar(parcial: Partial<AjustesMidia>) {
    setAjustes((atual) => ({ ...atual, ...parcial }));
  }

  async function enviar(arquivo: File | undefined, alvo: "midia" | "musica") {
    if (!arquivo) return;
    setErro("");
    const aceitos = alvo === "midia" ? tiposArquivoSite : tiposAudioSite;
    if (!aceitos.includes(arquivo.type) || arquivo.size > limiteArquivoSite) {
      setErro(
        alvo === "midia"
          ? "Escolha uma foto (JPG, PNG, WebP) ou vídeo (MP4, WebM) de até 100 MB."
          : "Escolha uma música MP3, M4A, AAC ou OGG de até 100 MB.",
      );
      return;
    }
    setProgresso({ alvo, valor: 0 });
    try {
      const url = await enviarParaSite(arquivo, (valor) => setProgresso({ alvo, valor }));
      if (alvo === "musica") ajustar({ musica: url });
      else {
        setMidia(url);
        setTipoMidia(arquivo.type.startsWith("video/") ? "video" : "imagem");
      }
    } catch {
      setErro("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setProgresso(undefined);
    }
  }

  function salvar(publicado: boolean) {
    setErro("");
    iniciarSalvamento(async () => {
      try {
        const resultado = await salvarConteudoSite({
          id: item?.id,
          tipo,
          titulo,
          subtitulo,
          texto: secao.texto ? texto : "",
          midia,
          tipoMidia,
          ...ajustes,
          // Som e música só fazem sentido em vídeo; foto guarda apenas o filtro.
          ...(tipoMidia === "imagem" && { somOriginal: true, musica: "" }),
          nota: tipo === "depoimento" ? nota : null,
          publicado,
          autorizacaoPublicacao: autorizado,
        });
        if (resultado.sucesso) aoConcluir(resultado.mensagem);
        else setErro(resultado.mensagem);
      } catch {
        setErro("Não foi possível salvar. Confira sua conexão e tente de novo.");
      }
    });
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        salvar(true);
      }}
    >
      <label className="flex items-start gap-3 rounded-xl border border-lilas/40 bg-lilas/10 p-3 text-sm leading-relaxed text-foreground">
        <input
          type="checkbox"
          checked={autorizado}
          disabled={ocupado}
          onChange={(event) => setAutorizado(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-brand"
        />
        <span>
          Tenho autorização das pessoas que aparecem neste conteúdo para divulgá-lo no site
          {tipo === "depoimento" ? " e o relato é verdadeiro" : ""}.
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
        <div>
          <span className="text-sm font-medium text-foreground">
            {secao.midia.rotulo}
            {!secao.midia.obrigatoria && (
              <span className="font-normal text-muted"> (opcional)</span>
            )}
          </span>
          <div
            className={`relative mt-1.5 overflow-hidden rounded-2xl border border-dashed border-border bg-creme/60 ${video ? "aspect-9/16" : "aspect-4/5"}`}
          >
            {midia ? (
              video ? (
                <PlayerSite midia={midia} ajustes={ajustes} rotulo="Prévia do vídeo" />
              ) : (
                <Image
                  src={midia}
                  alt="Prévia da foto"
                  fill
                  unoptimized={midia.startsWith("https:")}
                  sizes="240px"
                  style={{ filter: filtrosMidia[ajustes.filtro].css }}
                  className="object-cover object-top"
                />
              )
            ) : (
              <label
                className={`flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted ${autorizado && !ocupado ? "cursor-pointer hover:bg-lilas/10" : "cursor-not-allowed opacity-70"}`}
              >
                {progresso?.alvo === "midia" ? (
                  <>
                    <LoaderCircle className="size-6 animate-spin text-roxo" aria-hidden="true" />
                    <span role="status">Enviando… {progresso.valor}%</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-7 text-roxo" strokeWidth={1.5} aria-hidden="true" />
                    <span className="font-medium text-roxo">Escolher arquivo</span>
                    <span>
                      {autorizado ? "Foto ou vídeo, até 100 MB" : "Marque a autorização acima"}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  aria-label={secao.midia.rotulo}
                  accept={tiposArquivoSite.join(",")}
                  disabled={!autorizado || ocupado}
                  onChange={(event) => {
                    void enviar(event.target.files?.[0], "midia");
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          {midia && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => setMidia("")}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-perigo hover:underline disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Trocar arquivo
            </button>
          )}
        </div>

        <div className="grid content-start gap-4">
          <label className="text-sm font-medium text-foreground">
            {secao.titulo.rotulo}
            <input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder={secao.titulo.exemplo}
              maxLength={120}
              className={campo}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {secao.subtitulo.rotulo} <span className="font-normal text-muted">(opcional)</span>
            <input
              value={subtitulo}
              onChange={(event) => setSubtitulo(event.target.value)}
              placeholder={secao.subtitulo.exemplo}
              maxLength={160}
              className={campo}
            />
          </label>
          {tipo === "depoimento" && (
            <div>
              <span id="rotulo-nota" className="text-sm font-medium text-foreground">
                Nota do cliente
              </span>
              <div role="radiogroup" aria-labelledby="rotulo-nota" className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={nota === valor}
                    aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
                    onClick={() => setNota(valor)}
                    className="rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-roxo"
                  >
                    <Star
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className={`size-7 ${nota !== null && valor <= nota ? "fill-dourado text-dourado" : "text-dourado/40"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {midia && (
            <fieldset className="grid gap-4 rounded-2xl border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-brand">Ajustes da mídia</legend>
              <div>
                <span id="rotulo-filtro" className="text-xs font-medium text-muted">
                  Filtro
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="rotulo-filtro"
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  {nomesFiltro.map((filtro: FiltroMidia) => (
                    <button
                      key={filtro}
                      type="button"
                      role="radio"
                      aria-checked={ajustes.filtro === filtro}
                      onClick={() => ajustar({ filtro })}
                      className={`overflow-hidden rounded-xl border text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-roxo ${ajustes.filtro === filtro ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-roxo/40"}`}
                    >
                      {!video && (
                        <span className="relative block aspect-square">
                          <Image
                            src={midia}
                            alt=""
                            fill
                            unoptimized={midia.startsWith("https:")}
                            sizes="80px"
                            style={{ filter: filtrosMidia[filtro].css }}
                            className="object-cover object-top"
                          />
                        </span>
                      )}
                      <span className="block px-1 py-1.5">{filtrosMidia[filtro].rotulo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {video && (
                <>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={ajustes.somOriginal}
                      onChange={(event) => ajustar({ somOriginal: event.target.checked })}
                      className="size-4 accent-brand"
                    />
                    Manter o som original do vídeo
                  </label>

                  <div className="grid gap-2">
                    <span className="text-xs font-medium text-muted">Música de fundo</span>
                    {ajustes.musica ? (
                      <>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-lilas/10 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2 text-roxo">
                            <Music className="size-4" aria-hidden="true" />
                            Música adicionada
                          </span>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => ajustar({ musica: "" })}
                            className="text-xs font-medium text-perigo hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                        <label className="grid gap-1 text-xs text-muted">
                          Volume da música: {ajustes.volumeMusica}%
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={ajustes.volumeMusica}
                            onChange={(event) =>
                              ajustar({ volumeMusica: Number(event.target.value) })
                            }
                            className="accent-brand"
                          />
                        </label>
                      </>
                    ) : (
                      <label
                        className={`flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm ${autorizado && !ocupado ? "cursor-pointer text-roxo hover:bg-lilas/10" : "cursor-not-allowed text-muted opacity-70"}`}
                      >
                        {progresso?.alvo === "musica" ? (
                          <>
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                            <span role="status">Enviando música… {progresso.valor}%</span>
                          </>
                        ) : (
                          <>
                            <Music className="size-4" aria-hidden="true" />
                            Adicionar música (MP3 ou M4A)
                          </>
                        )}
                        <input
                          type="file"
                          aria-label="Música de fundo"
                          accept={tiposAudioSite.join(",")}
                          disabled={!autorizado || ocupado}
                          onChange={(event) => {
                            void enviar(event.target.files?.[0], "musica");
                            event.target.value = "";
                          }}
                          className="sr-only"
                        />
                      </label>
                    )}
                    <p className="text-xs text-muted">
                      Dê play na prévia ao lado para ouvir como vai ficar no site.
                    </p>
                  </div>
                </>
              )}
            </fieldset>
          )}
        </div>
      </div>

      {secao.texto && (
        <label className="text-sm font-medium text-foreground">
          {secao.texto.rotulo}
          {tipo !== "depoimento" && <span className="font-normal text-muted"> (opcional)</span>}
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder={secao.texto.exemplo}
            maxLength={2000}
            rows={5}
            className={campo}
          />
        </label>
      )}

      {erro && (
        <p
          role="alert"
          className="rounded-xl bg-perigo/10 px-3 py-2 text-sm font-medium text-perigo"
        >
          {erro}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => salvar(false)}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
        >
          Salvar rascunho
        </button>
        <button
          type="submit"
          disabled={ocupado}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
        >
          {salvando ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Publicar no site
        </button>
      </div>
    </form>
  );
}
