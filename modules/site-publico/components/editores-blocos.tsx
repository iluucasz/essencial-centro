"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { restaurarBlocoSite, salvarBlocoSite, type ResultadoConteudoSite } from "../actions";
import {
  blocosSite,
  capaCatalogoPadrao,
  descreverErroBloco,
  type BlocoCatalogo,
  type BlocoFaixa,
  type BlocoInicio,
  type CategoriaCatalogo,
  type ChaveBloco,
} from "../blocos";
import { iconesCatalogo, nomesIcone, type NomeIcone } from "../icones";
import { limiteArquivoSite } from "../validacao";
import { enviarParaSite } from "./formulario-conteudo";

export const campo =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-normal text-foreground transition outline-none placeholder:text-muted/70 focus:border-roxo focus:ring-2 focus:ring-roxo/20 disabled:bg-creme/50";
export const botaoIcone =
  "inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-roxo disabled:pointer-events-none disabled:opacity-30";
export const tiposImagem = ["image/jpeg", "image/png", "image/webp"];

export function mover<T>(lista: T[], posicao: number, direcao: -1 | 1) {
  const destino = posicao + direcao;
  if (destino < 0 || destino >= lista.length) return lista;
  const copia = [...lista];
  [copia[posicao], copia[destino]] = [copia[destino], copia[posicao]];
  return copia;
}

/** Salvar/restaurar de um bloco: valida no navegador com o mesmo schema do servidor. */
export function useBloco(chave: ChaveBloco) {
  const router = useRouter();
  const [aviso, setAviso] = useState<ResultadoConteudoSite>();
  const [ocupado, iniciar] = useTransition();

  function executar(acao: () => Promise<ResultadoConteudoSite>) {
    setAviso(undefined);
    iniciar(async () => {
      try {
        const resultado = await acao();
        setAviso(resultado);
        if (resultado.sucesso) router.refresh();
      } catch {
        setAviso({ sucesso: false, mensagem: "Não foi possível salvar. Tente novamente." });
      }
    });
  }

  return {
    aviso,
    ocupado,
    salvar(valor: unknown) {
      const validacao = blocosSite[chave].schema.safeParse(valor);
      if (!validacao.success) {
        setAviso({ sucesso: false, mensagem: descreverErroBloco(validacao.error) });
        return;
      }
      executar(() => salvarBlocoSite(chave, validacao.data));
    },
    restaurar: () => executar(() => restaurarBlocoSite(chave)),
  };
}

export function PainelBloco({
  titulo,
  descricao,
  personalizado,
  somenteLeitura,
  bloco,
  aoSalvar,
  previa,
  children,
}: {
  titulo: string;
  descricao: string;
  personalizado: boolean;
  somenteLeitura: boolean;
  bloco: ReturnType<typeof useBloco>;
  aoSalvar: () => void;
  previa?: ReactNode;
  children: ReactNode;
}) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        aoSalvar();
      }}
      className="grid gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand">{titulo}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{descricao}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${personalizado ? "bg-roxo/10 text-roxo" : "bg-creme text-muted"}`}
        >
          {personalizado ? "Personalizado" : "Texto original"}
        </span>
      </div>

      <div className={previa ? "grid gap-6 xl:grid-cols-[1fr_minmax(0,26rem)]" : "grid"}>
        <fieldset disabled={somenteLeitura || bloco.ocupado} className="grid min-w-0 gap-4">
          {children}
        </fieldset>
        {previa && (
          <div className="hidden xl:block">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Prévia</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-creme p-6">
              {previa}
            </div>
          </div>
        )}
      </div>

      {bloco.aviso && (
        <p
          role={bloco.aviso.sucesso ? "status" : "alert"}
          className={`rounded-xl px-3 py-2 text-sm font-medium ${bloco.aviso.sucesso ? "bg-brand/10 text-brand" : "bg-perigo/10 text-perigo"}`}
        >
          {bloco.aviso.mensagem}
        </p>
      )}

      {!somenteLeitura && (
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {personalizado ? (
            confirmando ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-foreground">Voltar ao texto original?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmando(false);
                    bloco.restaurar();
                  }}
                  className="rounded-lg bg-perigo px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Sim, restaurar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={bloco.ocupado}
                onClick={() => setConfirmando(true)}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-perigo"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Restaurar texto original
              </button>
            )
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={bloco.ocupado}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
          >
            {bloco.ocupado ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Publicar alterações
          </button>
        </div>
      )}
    </form>
  );
}

export function Campo({
  rotulo,
  opcional,
  dica,
  children,
}: {
  rotulo: string;
  opcional?: boolean;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <label className="text-sm font-medium text-foreground">
      {rotulo}
      {opcional && <span className="font-normal text-muted"> (opcional)</span>}
      {children}
      {dica && <span className="mt-1 block text-xs font-normal text-muted">{dica}</span>}
    </label>
  );
}

export function EditorInicio({
  valor,
  personalizado,
  somenteLeitura,
}: {
  valor: BlocoInicio;
  personalizado: boolean;
  somenteLeitura: boolean;
}) {
  const [textos, setTextos] = useState(valor);
  const bloco = useBloco("inicio");
  const campoTexto = (chave: keyof BlocoInicio, maximo: number) => ({
    value: textos[chave],
    maxLength: maximo,
    className: campo,
    onChange: (evento: { target: { value: string } }) =>
      setTextos((atual) => ({ ...atual, [chave]: evento.target.value })),
  });

  return (
    <PainelBloco
      titulo="Textos da seção inicial"
      descricao="O primeiro bloco do site: selo, título, apresentação e os botões ao lado do carrossel."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(textos)}
      previa={
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-roxo uppercase">
            {textos.selo}
          </p>
          <p className="mt-3 font-serif text-3xl leading-tight text-brand">
            {textos.tituloLinha1}
            <br />
            <span className="text-roxo italic">{textos.tituloLinha2}</span>
          </p>
          <div className="mt-3 h-px w-12 bg-dourado" />
          <p className="mt-3 text-sm text-muted">{textos.chamada}</p>
          <p className="mt-2 line-clamp-4 text-xs text-muted">{textos.paragrafo}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand px-3 py-1.5 text-xs text-surface">
              {textos.botaoPrincipal}
            </span>
            <span className="rounded-full border border-brand/25 px-3 py-1.5 text-xs text-brand">
              {textos.botaoSecundario}
            </span>
          </div>
          {textos.rodape && <p className="mt-3 text-[0.7rem] text-brand">{textos.rodape}</p>}
        </div>
      }
    >
      <Campo rotulo="Selo" dica="Linha curta acima do título, em letras maiúsculas.">
        <input {...campoTexto("selo", 80)} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Título (1ª linha)">
          <input {...campoTexto("tituloLinha1", 60)} />
        </Campo>
        <Campo rotulo="Título (2ª linha)" dica="Aparece em roxo e itálico.">
          <input {...campoTexto("tituloLinha2", 60)} />
        </Campo>
      </div>
      <Campo rotulo="Chamada">
        <input {...campoTexto("chamada", 200)} />
      </Campo>
      <Campo rotulo="Parágrafo">
        <textarea rows={4} {...campoTexto("paragrafo", 600)} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Botão principal" dica="Abre o WhatsApp para agendar.">
          <input {...campoTexto("botaoPrincipal", 40)} />
        </Campo>
        <Campo rotulo="Botão secundário" dica="Leva até o catálogo.">
          <input {...campoTexto("botaoSecundario", 40)} />
        </Campo>
      </div>
      <Campo rotulo="Frase final" opcional dica="Linha pequena abaixo dos botões.">
        <input {...campoTexto("rodape", 140)} />
      </Campo>
    </PainelBloco>
  );
}

export function EditorFaixa({
  valor,
  personalizado,
  somenteLeitura,
}: {
  valor: BlocoFaixa;
  personalizado: boolean;
  somenteLeitura: boolean;
}) {
  const [palavras, setPalavras] = useState(valor.palavras);
  const bloco = useBloco("faixa");

  return (
    <PainelBloco
      titulo="Faixa"
      descricao="A faixa lilás logo abaixo da seção inicial, com palavras separadas por pontos. Até 6 palavras."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar({ palavras })}
    >
      <div className="overflow-hidden rounded-xl border border-lilas/25 bg-lilas/15 px-4 py-4 text-center text-xs font-medium tracking-[0.18em] text-roxo uppercase">
        {palavras.map((palavra, posicao) => (
          <Fragment key={posicao}>
            {posicao > 0 && <span className="mx-3 text-dourado">·</span>}
            {palavra || "…"}
          </Fragment>
        ))}
      </div>
      <ol className="grid gap-2">
        {palavras.map((palavra, posicao) => (
          <li key={posicao} className="flex items-center gap-2">
            <input
              aria-label={`Palavra ${posicao + 1}`}
              value={palavra}
              maxLength={40}
              onChange={(evento) =>
                setPalavras((atual) =>
                  atual.map((item, indice) => (indice === posicao ? evento.target.value : item)),
                )
              }
              className={`${campo} mt-0`}
            />
            <button
              type="button"
              className={botaoIcone}
              aria-label={`Mover palavra ${posicao + 1} para antes`}
              disabled={posicao === 0}
              onClick={() => setPalavras((atual) => mover(atual, posicao, -1))}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={botaoIcone}
              aria-label={`Mover palavra ${posicao + 1} para depois`}
              disabled={posicao === palavras.length - 1}
              onClick={() => setPalavras((atual) => mover(atual, posicao, 1))}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
              aria-label={`Remover palavra ${posicao + 1}`}
              disabled={palavras.length === 1}
              onClick={() =>
                setPalavras((atual) => atual.filter((_, indice) => indice !== posicao))
              }
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      {palavras.length < 6 && (
        <button
          type="button"
          onClick={() => setPalavras((atual) => [...atual, ""])}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar palavra
        </button>
      )}
    </PainelBloco>
  );
}

function EditorCategoria({
  categoria,
  numero,
  total,
  aberta,
  aoAlternar,
  aoMudar,
  aoMover,
  aoRemover,
}: {
  categoria: CategoriaCatalogo;
  numero: number;
  total: number;
  aberta: boolean;
  aoAlternar: () => void;
  aoMudar: (parcial: Partial<CategoriaCatalogo>) => void;
  aoMover: (direcao: -1 | 1) => void;
  aoRemover: () => void;
}) {
  const [progresso, setProgresso] = useState<number>();
  const [erroEnvio, setErroEnvio] = useState("");
  const Icone = iconesCatalogo[categoria.icone].icone;

  async function adicionarArte(arquivo?: File) {
    if (!arquivo) return;
    setErroEnvio("");
    if (!tiposImagem.includes(arquivo.type) || arquivo.size > limiteArquivoSite) {
      setErroEnvio("Escolha uma imagem JPG, PNG ou WebP de até 100 MB.");
      return;
    }
    setProgresso(0);
    try {
      const imagem = await enviarParaSite(arquivo, setProgresso);
      aoMudar({ paginas: [...categoria.paginas, { titulo: categoria.nome, imagem }] });
    } catch {
      setErroEnvio("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setProgresso(undefined);
    }
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={aoAlternar}
          aria-expanded={aberta}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left focus-visible:outline-2 focus-visible:outline-roxo"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lilas/15 text-roxo">
            <Icone className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-brand">
              {categoria.nome || `Categoria ${numero}`}
            </span>
            <span className="block text-xs text-muted">
              {categoria.tratamentos.length} tratamentos · {categoria.paginas.length}{" "}
              {categoria.paginas.length === 1 ? "arte" : "artes"}
            </span>
          </span>
          <ChevronDown
            className={`ml-auto size-4 shrink-0 text-muted transition ${aberta ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className={botaoIcone}
          aria-label={`Mover ${categoria.nome} para antes`}
          disabled={numero === 1}
          onClick={() => aoMover(-1)}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={botaoIcone}
          aria-label={`Mover ${categoria.nome} para depois`}
          disabled={numero === total}
          onClick={() => aoMover(1)}
        >
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
          aria-label={`Remover ${categoria.nome}`}
          disabled={total === 1}
          onClick={aoRemover}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {aberta && (
        <div className="grid gap-4 border-t border-border/70 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome da categoria">
              <input
                value={categoria.nome}
                maxLength={60}
                onChange={(evento) => aoMudar({ nome: evento.target.value })}
                className={campo}
              />
            </Campo>
            <Campo rotulo="Chamada" opcional dica="Texto curto acima do nome.">
              <input
                value={categoria.chamada}
                maxLength={80}
                onChange={(evento) => aoMudar({ chamada: evento.target.value })}
                className={campo}
              />
            </Campo>
          </div>
          <Campo rotulo="Descrição">
            <textarea
              rows={3}
              value={categoria.descricao}
              maxLength={600}
              onChange={(evento) => aoMudar({ descricao: evento.target.value })}
              className={campo}
            />
          </Campo>
          <div>
            <span id={`icone-${categoria.slug}`} className="text-sm font-medium text-foreground">
              Ícone
            </span>
            <div
              role="radiogroup"
              aria-labelledby={`icone-${categoria.slug}`}
              className="mt-1.5 flex flex-wrap gap-2"
            >
              {nomesIcone.map((nome: NomeIcone) => {
                const Opcao = iconesCatalogo[nome].icone;
                return (
                  <button
                    key={nome}
                    type="button"
                    role="radio"
                    aria-checked={categoria.icone === nome}
                    aria-label={iconesCatalogo[nome].rotulo}
                    title={iconesCatalogo[nome].rotulo}
                    onClick={() => aoMudar({ icone: nome })}
                    className={`flex size-10 items-center justify-center rounded-xl border transition ${categoria.icone === nome ? "border-brand bg-brand text-brand-foreground" : "border-border text-roxo hover:border-roxo/40"}`}
                  >
                    <Opcao className="size-4" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
          <Campo rotulo="Tratamentos" dica="Um por linha. Aparecem como lista com ✓ no site.">
            <textarea
              rows={Math.min(10, Math.max(4, categoria.tratamentos.length + 1))}
              value={categoria.tratamentos.join("\n")}
              onChange={(evento) =>
                aoMudar({
                  tratamentos: evento.target.value.split("\n").map((linha) => linha.trimStart()),
                })
              }
              onBlur={() =>
                aoMudar({
                  tratamentos: categoria.tratamentos.map((linha) => linha.trim()).filter(Boolean),
                })
              }
              className={campo}
            />
          </Campo>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Artes do catálogo</span>
            {categoria.paginas.length === 0 && (
              <p className="text-xs text-muted">
                Sem arte própria, a categoria usa a capa geral do catálogo.
              </p>
            )}
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoria.paginas.map((pagina, posicao) => (
                <li
                  key={`${pagina.imagem}-${posicao}`}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <div className="relative aspect-[3/4] bg-creme">
                    <Image
                      src={pagina.imagem}
                      alt=""
                      fill
                      unoptimized={pagina.imagem.startsWith("https:")}
                      sizes="200px"
                      className="object-contain"
                    />
                  </div>
                  <div className="grid gap-2 p-2">
                    <input
                      aria-label={`Título da arte ${posicao + 1}`}
                      value={pagina.titulo}
                      maxLength={80}
                      onChange={(evento) =>
                        aoMudar({
                          paginas: categoria.paginas.map((item, indice) =>
                            indice === posicao ? { ...item, titulo: evento.target.value } : item,
                          ),
                        })
                      }
                      className={`${campo} mt-0 py-1.5 text-xs`}
                    />
                    <div className="flex justify-between">
                      <div className="flex">
                        <button
                          type="button"
                          className={botaoIcone}
                          aria-label={`Mover arte ${posicao + 1} para antes`}
                          disabled={posicao === 0}
                          onClick={() =>
                            aoMudar({ paginas: mover(categoria.paginas, posicao, -1) })
                          }
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={botaoIcone}
                          aria-label={`Mover arte ${posicao + 1} para depois`}
                          disabled={posicao === categoria.paginas.length - 1}
                          onClick={() => aoMudar({ paginas: mover(categoria.paginas, posicao, 1) })}
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
                        aria-label={`Remover arte ${posicao + 1}`}
                        onClick={() =>
                          aoMudar({
                            paginas: categoria.paginas.filter((_, indice) => indice !== posicao),
                          })
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium text-roxo hover:bg-lilas/10">
              {progresso !== undefined ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  <span role="status">Enviando… {progresso}%</span>
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" aria-hidden="true" />
                  Adicionar arte
                </>
              )}
              <input
                type="file"
                aria-label={`Adicionar arte em ${categoria.nome}`}
                accept={tiposImagem.join(",")}
                disabled={progresso !== undefined}
                onChange={(evento) => {
                  void adicionarArte(evento.target.files?.[0]);
                  evento.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            {erroEnvio && (
              <p role="alert" className="text-xs text-perigo">
                {erroEnvio}
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function EditorCatalogo({
  valor,
  personalizado,
  somenteLeitura,
}: {
  valor: BlocoCatalogo;
  personalizado: boolean;
  somenteLeitura: boolean;
}) {
  const [catalogo, setCatalogo] = useState(valor);
  const [aberta, setAberta] = useState<string>();
  const bloco = useBloco("catalogo");

  function mudarCategoria(posicao: number, parcial: Partial<CategoriaCatalogo>) {
    setCatalogo((atual) => ({
      ...atual,
      categorias: atual.categorias.map((categoria, indice) =>
        indice === posicao ? { ...categoria, ...parcial } : categoria,
      ),
    }));
  }

  return (
    <PainelBloco
      titulo="Catálogo"
      descricao="O cabeçalho da seção e as categorias de atendimento, com tratamentos e artes. A lista de categorias também alimenta o contato e o rodapé do site."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() =>
        bloco.salvar({
          ...catalogo,
          categorias: catalogo.categorias.map((categoria) => ({
            ...categoria,
            tratamentos: categoria.tratamentos.map((linha) => linha.trim()).filter(Boolean),
          })),
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Selo">
          <input
            value={catalogo.selo}
            maxLength={60}
            onChange={(evento) => setCatalogo({ ...catalogo, selo: evento.target.value })}
            className={campo}
          />
        </Campo>
        <Campo rotulo="Subtítulo" opcional>
          <input
            value={catalogo.subtitulo}
            maxLength={240}
            onChange={(evento) => setCatalogo({ ...catalogo, subtitulo: evento.target.value })}
            className={campo}
          />
        </Campo>
      </div>
      <Campo rotulo="Título" dica="Cada linha digitada vira uma linha no site.">
        <textarea
          rows={2}
          value={catalogo.titulo}
          maxLength={160}
          onChange={(evento) => setCatalogo({ ...catalogo, titulo: evento.target.value })}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Aviso no fim da seção" opcional>
        <input
          value={catalogo.aviso}
          maxLength={240}
          onChange={(evento) => setCatalogo({ ...catalogo, aviso: evento.target.value })}
          className={campo}
        />
      </Campo>

      <div className="grid gap-2">
        <span className="text-sm font-semibold text-brand">
          Categorias ({catalogo.categorias.length})
        </span>
        <ol className="grid gap-2">
          {catalogo.categorias.map((categoria, posicao) => (
            <EditorCategoria
              key={categoria.slug}
              categoria={categoria}
              numero={posicao + 1}
              total={catalogo.categorias.length}
              aberta={aberta === categoria.slug}
              aoAlternar={() => setAberta(aberta === categoria.slug ? undefined : categoria.slug)}
              aoMudar={(parcial) => mudarCategoria(posicao, parcial)}
              aoMover={(direcao) =>
                setCatalogo((atual) => ({
                  ...atual,
                  categorias: mover(atual.categorias, posicao, direcao),
                }))
              }
              aoRemover={() =>
                setCatalogo((atual) => ({
                  ...atual,
                  categorias: atual.categorias.filter((_, indice) => indice !== posicao),
                }))
              }
            />
          ))}
        </ol>
        {catalogo.categorias.length < 15 && (
          <button
            type="button"
            onClick={() => {
              const slug = `categoria-${Date.now().toString(36)}`;
              setCatalogo((atual) => ({
                ...atual,
                categorias: [
                  ...atual.categorias,
                  {
                    slug,
                    nome: "",
                    chamada: "",
                    descricao: "",
                    icone: "flor",
                    tratamentos: [],
                    paginas: [],
                  },
                ],
              }));
              setAberta(slug);
            }}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar categoria
          </button>
        )}
        <p className="text-xs text-muted">
          Categorias sem arte usam a capa geral{" "}
          <a
            href={capaCatalogoPadrao}
            target="_blank"
            rel="noopener noreferrer"
            className="text-roxo underline"
          >
            (ver capa)
          </a>
          . As alterações só vão para o site ao clicar em “Publicar alterações”.
        </p>
      </div>
    </PainelBloco>
  );
}
