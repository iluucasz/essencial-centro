"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LoaderCircle,
  Music,
  Pencil,
  Play,
  Plus,
  Quote,
  Star,
  Trash2,
  VolumeX,
} from "lucide-react";
import { ConteudoModal } from "@/components/ui/modal-formulario";
import {
  alternarPublicacaoConteudo,
  excluirConteudoSite,
  moverConteudo,
  type ResultadoConteudoSite,
} from "../actions";
import type { ConteudoSite } from "../schema";
import type { BlocosSite, ChaveBloco } from "../blocos";
import { filtrosMidia, secoesConteudo, type TipoConteudo } from "../validacao";
import { EditorCatalogo, EditorFaixa, EditorInicio } from "./editores-blocos";
import {
  EditorCabecalhoSecao,
  EditorContato,
  EditorDuvidas,
  EditorJornada,
  EditorLogin,
  EditorRodape,
  EditorSobre,
} from "./editores-secoes";
import { FormularioConteudo } from "./formulario-conteudo";

const botaoIcone =
  "inline-flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-creme hover:text-brand focus-visible:outline-2 focus-visible:outline-roxo disabled:pointer-events-none disabled:opacity-30";

function estaNoSite(item: ConteudoSite) {
  return item.publicado && item.autorizacaoPublicacao;
}

function Miniatura({ item }: { item: ConteudoSite }) {
  if (item.tipo === "depoimento" && !item.midia)
    return (
      <div className="flex h-full flex-col gap-3 bg-lilas/10 p-4">
        <div className="flex gap-0.5" aria-label={`Nota ${item.nota ?? "não informada"}`}>
          {Array.from({ length: 5 }, (_, indice) => (
            <Star
              key={indice}
              aria-hidden="true"
              className={`size-3.5 ${item.nota && indice < item.nota ? "fill-dourado text-dourado" : "text-dourado/30"}`}
            />
          ))}
        </div>
        <Quote className="size-5 text-lilas" aria-hidden="true" />
        <p className="line-clamp-5 text-xs leading-relaxed text-foreground">{item.texto}</p>
      </div>
    );
  if (item.tipoMidia === "video")
    return (
      <video
        src={`${item.midia}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        style={{ filter: filtrosMidia[item.filtro].css }}
        className="h-full w-full bg-foreground/5 object-cover"
      />
    );
  return (
    <Image
      src={item.midia}
      alt=""
      fill
      unoptimized={item.midia.startsWith("https:")}
      sizes="(max-width: 640px) 50vw, 240px"
      style={{ filter: filtrosMidia[item.filtro].css }}
      className="object-cover object-top"
    />
  );
}

function CartaoConteudo({
  item,
  primeiro,
  ultimo,
  somenteLeitura,
  ocupado,
  aoAgir,
  aoEditar,
  aoExcluir,
}: {
  item: ConteudoSite;
  primeiro: boolean;
  ultimo: boolean;
  somenteLeitura: boolean;
  ocupado: boolean;
  aoAgir: (acao: () => Promise<ResultadoConteudoSite>) => void;
  aoEditar: () => void;
  aoExcluir: () => void;
}) {
  const noSite = estaNoSite(item);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        disabled={somenteLeitura}
        onClick={aoEditar}
        aria-label={`Abrir ${item.titulo}`}
        className="group/miniatura relative block aspect-4/3 overflow-hidden bg-creme text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-roxo disabled:cursor-default"
      >
        <Miniatura item={item} />
        {item.tipoMidia === "video" && item.midia && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand shadow-md transition group-hover/miniatura:scale-110 motion-reduce:transition-none"
          >
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        )}
        {(item.musica || item.filtro !== "original" || !item.somOriginal) && (
          <span className="absolute right-2 bottom-2 flex gap-1">
            {item.filtro !== "original" && (
              <span className="rounded-full bg-surface/90 px-2 py-0.5 text-[0.7rem] font-medium text-roxo">
                {filtrosMidia[item.filtro].rotulo}
              </span>
            )}
            {(item.musica || !item.somOriginal) && (
              <span className="flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[0.7rem] font-medium text-roxo">
                {item.musica ? (
                  <Music className="size-3" aria-hidden="true" />
                ) : (
                  <VolumeX className="size-3" aria-hidden="true" />
                )}
                {item.musica ? "Música" : "Sem som"}
              </span>
            )}
          </span>
        )}
        <span
          className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${noSite ? "bg-brand text-brand-foreground" : "bg-surface text-muted"}`}
        >
          {noSite ? "No site" : "Rascunho"}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-medium text-brand">{item.titulo}</h3>
        {item.subtitulo && <p className="line-clamp-1 text-xs text-muted">{item.subtitulo}</p>}
      </div>
      {!somenteLeitura && (
        <div className="flex items-center justify-between gap-1 border-t border-border/70 px-2 py-1.5">
          <div className="flex">
            <button
              type="button"
              className={botaoIcone}
              disabled={primeiro || ocupado}
              aria-label={`Mover ${item.titulo} para antes`}
              title="Mover para antes"
              onClick={() => aoAgir(() => moverConteudo(item.id, "acima"))}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={botaoIcone}
              disabled={ultimo || ocupado}
              aria-label={`Mover ${item.titulo} para depois`}
              title="Mover para depois"
              onClick={() => aoAgir(() => moverConteudo(item.id, "abaixo"))}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex">
            <button
              type="button"
              className={botaoIcone}
              disabled={ocupado}
              aria-label={noSite ? `Ocultar ${item.titulo} do site` : `Publicar ${item.titulo}`}
              title={noSite ? "Ocultar do site" : "Publicar no site"}
              onClick={() => aoAgir(() => alternarPublicacaoConteudo(item.id, !noSite))}
            >
              {noSite ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className={botaoIcone}
              disabled={ocupado}
              aria-label={`Editar ${item.titulo}`}
              title="Editar"
              onClick={aoEditar}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
              disabled={ocupado}
              aria-label={`Excluir ${item.titulo}`}
              title="Excluir"
              onClick={aoExcluir}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function ListaConteudos({
  tipo: aba,
  itens,
  somenteLeitura,
}: {
  tipo: TipoConteudo;
  itens: ConteudoSite[];
  somenteLeitura: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<ConteudoSite>();
  const [excluindo, setExcluindo] = useState<ConteudoSite>();
  const [aviso, setAviso] = useState<ResultadoConteudoSite>();
  const [ocupado, iniciar] = useTransition();
  const modalFormulario = useOverlayState();
  const modalExclusao = useOverlayState();
  const secao = secoesConteudo[aba];
  const daSecao = itens.filter((item) => item.tipo === aba);

  function agir(acao: () => Promise<ResultadoConteudoSite>, aoTerminar?: () => void) {
    setAviso(undefined);
    iniciar(async () => {
      try {
        const resultado = await acao();
        if (resultado.mensagem) setAviso(resultado);
        if (resultado.sucesso) {
          aoTerminar?.();
          router.refresh();
        }
      } catch {
        setAviso({ sucesso: false, mensagem: "Não foi possível concluir. Tente novamente." });
      }
    });
  }

  function abrirFormulario(item?: ConteudoSite) {
    setAviso(undefined);
    setEditando(item);
    modalFormulario.open();
  }

  return (
    <div className="grid gap-6">
      <section aria-label={secao.rotulo} className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted">{secao.descricao}</p>
          {!somenteLeitura && (
            <button
              type="button"
              onClick={() => abrirFormulario()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar {secao.item}
            </button>
          )}
        </div>

        {aviso && (
          <p
            role={aviso.sucesso ? "status" : "alert"}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${aviso.sucesso ? "bg-brand/10 text-brand" : "bg-perigo/10 text-perigo"}`}
          >
            {aviso.mensagem}
          </p>
        )}

        {daSecao.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
            {secao.vazio}
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {daSecao.map((item, posicao) => (
              <CartaoConteudo
                key={item.id}
                item={item}
                primeiro={posicao === 0}
                ultimo={posicao === daSecao.length - 1}
                somenteLeitura={somenteLeitura}
                ocupado={ocupado}
                aoAgir={(acao) => agir(acao)}
                aoEditar={() => abrirFormulario(item)}
                aoExcluir={() => {
                  setExcluindo(item);
                  modalExclusao.open();
                }}
              />
            ))}
          </ol>
        )}
        {daSecao.length > 1 && (
          <p className="text-xs text-muted">
            O site mostra os itens nesta mesma ordem. Use as setas para reorganizar.
          </p>
        )}
      </section>

      <Modal state={modalFormulario}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="lg">
            <ConteudoModal titulo={`${editando ? "Editar" : "Adicionar"} ${secao.item}`}>
              <FormularioConteudo
                key={editando?.id ?? `novo-${aba}`}
                tipo={aba}
                item={editando}
                aoConcluir={(mensagem) => {
                  modalFormulario.close();
                  setAviso({ sucesso: true, mensagem });
                  router.refresh();
                }}
              />
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={modalExclusao}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="sm">
            <ConteudoModal corTitulo="text-perigo" titulo={`Excluir ${secao.item}`}>
              <div className="grid gap-4">
                <p className="text-sm text-foreground">
                  Excluir <strong>{excluindo?.titulo}</strong>? Ele sai do site na hora e o arquivo
                  enviado é apagado.
                </p>
                <div className="grid gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={modalExclusao.close}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-creme"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => {
                      if (excluindo)
                        agir(() => excluirConteudoSite(excluindo.id), modalExclusao.close);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-perigo px-4 text-sm font-semibold text-white transition hover:bg-perigo/90 disabled:opacity-60"
                  >
                    {ocupado ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                    Excluir
                  </button>
                </div>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

type Aba =
  | "inicio"
  | "faixa"
  | "catalogo"
  | "jornada"
  | "sobre"
  | "profissional"
  | "depoimento"
  | "login"
  | "duvidas"
  | "contato"
  | "rodape";

/** Abas na mesma ordem em que as seções aparecem no site. */
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "inicio", rotulo: "Seção inicial" },
  { id: "faixa", rotulo: "Faixa" },
  { id: "catalogo", rotulo: "Catálogo" },
  { id: "jornada", rotulo: "Como funciona" },
  { id: "sobre", rotulo: "Sobre" },
  { id: "profissional", rotulo: "Profissionais" },
  { id: "depoimento", rotulo: "Depoimentos" },
  { id: "login", rotulo: "Login" },
  { id: "duvidas", rotulo: "Dúvidas frequentes" },
  { id: "contato", rotulo: "Contato" },
  { id: "rodape", rotulo: "Rodapé" },
];

export function GerenciadorSite({
  itens,
  blocos,
  personalizados = [],
  somenteLeitura,
}: {
  itens: ConteudoSite[];
  blocos: BlocosSite;
  personalizados?: ChaveBloco[];
  somenteLeitura: boolean;
}) {
  const [aba, setAba] = useState<Aba>("inicio");
  const rotulo = ABAS.find((item) => item.id === aba)!.rotulo;

  return (
    <div className="grid gap-6">
      <div
        role="tablist"
        aria-label="Seções do site"
        className="flex w-full flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1"
      >
        {ABAS.map(({ id, rotulo: nome }) => {
          const total =
            id === "profissional" || id === "depoimento"
              ? itens.filter((item) => item.tipo === id).length
              : null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-roxo ${aba === id ? "bg-brand text-brand-foreground" : "text-muted hover:bg-creme hover:text-brand"}`}
            >
              {nome}
              {total !== null && (
                <span
                  className={`rounded-full px-2 text-xs ${aba === id ? "bg-white/20" : "bg-creme"}`}
                >
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={rotulo} className="grid gap-8">
        {aba === "inicio" && (
          <>
            <EditorInicio
              valor={blocos.inicio}
              personalizado={personalizados.includes("inicio")}
              somenteLeitura={somenteLeitura}
            />
            <div className="grid gap-3">
              <h2 className="text-lg font-semibold text-brand">Fotos e vídeos do carrossel</h2>
              <ListaConteudos tipo="destaque" itens={itens} somenteLeitura={somenteLeitura} />
            </div>
          </>
        )}
        {aba === "faixa" && (
          <EditorFaixa
            valor={blocos.faixa}
            personalizado={personalizados.includes("faixa")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "catalogo" && (
          <EditorCatalogo
            valor={blocos.catalogo}
            personalizado={personalizados.includes("catalogo")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "jornada" && (
          <EditorJornada
            valor={blocos.jornada}
            personalizado={personalizados.includes("jornada")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "sobre" && (
          <EditorSobre
            valor={blocos.sobre}
            personalizado={personalizados.includes("sobre")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "profissional" && (
          <>
            <EditorCabecalhoSecao
              chave="profissionais"
              titulo="Textos da seção de profissionais"
              descricao="O título acima dos cartões de profissionais."
              valor={blocos.profissionais}
              personalizado={personalizados.includes("profissionais")}
              somenteLeitura={somenteLeitura}
            />
            <ListaConteudos tipo="profissional" itens={itens} somenteLeitura={somenteLeitura} />
          </>
        )}
        {aba === "depoimento" && (
          <>
            <EditorCabecalhoSecao
              chave="depoimentos"
              titulo="Textos da seção de depoimentos"
              descricao="O título acima dos depoimentos."
              valor={blocos.depoimentos}
              personalizado={personalizados.includes("depoimentos")}
              somenteLeitura={somenteLeitura}
            />
            <ListaConteudos tipo="depoimento" itens={itens} somenteLeitura={somenteLeitura} />
          </>
        )}
        {aba === "login" && (
          <EditorLogin
            valor={blocos.login}
            personalizado={personalizados.includes("login")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "duvidas" && (
          <EditorDuvidas
            valor={blocos.duvidas}
            personalizado={personalizados.includes("duvidas")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "contato" && (
          <EditorContato
            valor={blocos.contato}
            personalizado={personalizados.includes("contato")}
            somenteLeitura={somenteLeitura}
          />
        )}
        {aba === "rodape" && (
          <EditorRodape
            valor={blocos.rodape}
            personalizado={personalizados.includes("rodape")}
            somenteLeitura={somenteLeitura}
          />
        )}
      </div>
    </div>
  );
}
