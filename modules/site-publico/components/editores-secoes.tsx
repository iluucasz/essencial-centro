"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import type {
  BlocoCabecalho,
  BlocoContato,
  BlocoDuvidas,
  BlocoJornada,
  BlocoLogin,
  BlocoRodape,
  BlocoSobre,
} from "../blocos";
import { iconesCatalogo, nomesIcone, type NomeIcone } from "../icones";
import { limiteArquivoSite } from "../validacao";
import {
  botaoIcone,
  Campo,
  campo,
  mover,
  PainelBloco,
  tiposImagem,
  useBloco,
} from "./editores-blocos";
import { enviarParaSite } from "./formulario-conteudo";

type PropsEditor<T> = { valor: T; personalizado: boolean; somenteLeitura: boolean };

/* ---------- Peças reutilizáveis ---------- */

function CampoImagem({
  rotulo,
  valor,
  aoMudar,
  opcional = false,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (url: string) => void;
  opcional?: boolean;
}) {
  const [progresso, setProgresso] = useState<number>();
  const [erro, setErro] = useState("");

  async function enviar(arquivo?: File) {
    if (!arquivo) return;
    setErro("");
    if (!tiposImagem.includes(arquivo.type) || arquivo.size > limiteArquivoSite) {
      setErro("Escolha uma imagem JPG, PNG ou WebP de até 100 MB.");
      return;
    }
    setProgresso(0);
    try {
      aoMudar(await enviarParaSite(arquivo, setProgresso));
    } catch {
      setErro("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setProgresso(undefined);
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {rotulo}
        {opcional && <span className="font-normal text-muted"> (opcional)</span>}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative aspect-4/5 w-28 overflow-hidden rounded-xl border border-border bg-creme">
          {valor ? (
            <Image
              src={valor}
              alt=""
              fill
              unoptimized={valor.startsWith("https:")}
              sizes="112px"
              className="object-cover object-top"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-muted">
              Sem imagem
            </span>
          )}
        </div>
        <div className="grid gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium text-roxo hover:bg-lilas/10">
            {progresso !== undefined ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span role="status">Enviando… {progresso}%</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-4" aria-hidden="true" />
                {valor ? "Trocar imagem" : "Enviar imagem"}
              </>
            )}
            <input
              type="file"
              aria-label={`${rotulo}: escolher arquivo`}
              accept={tiposImagem.join(",")}
              disabled={progresso !== undefined}
              onChange={(evento) => {
                void enviar(evento.target.files?.[0]);
                evento.target.value = "";
              }}
              className="sr-only"
            />
          </label>
          {opcional && valor && (
            <button
              type="button"
              onClick={() => aoMudar("")}
              className="w-fit text-xs font-medium text-perigo hover:underline"
            >
              Remover imagem
            </button>
          )}
        </div>
      </div>
      {erro && (
        <p role="alert" className="text-xs text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Lista de frases curtas (destaques, recursos), com adicionar, reordenar e remover. */
function ListaTextos({
  rotulo,
  item,
  itens,
  aoMudar,
  maximo,
  maxCaracteres = 120,
}: {
  rotulo: string;
  item: string;
  itens: string[];
  aoMudar: (itens: string[]) => void;
  maximo: number;
  maxCaracteres?: number;
}) {
  const nome = item.toLocaleLowerCase("pt-BR");
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{rotulo}</span>
      <ol className="grid gap-2">
        {itens.map((texto, posicao) => (
          <li key={posicao} className="flex items-center gap-1">
            <input
              aria-label={`${item} ${posicao + 1}`}
              value={texto}
              maxLength={maxCaracteres}
              onChange={(evento) =>
                aoMudar(
                  itens.map((atual, indice) => (indice === posicao ? evento.target.value : atual)),
                )
              }
              className={`${campo} mt-0`}
            />
            <button
              type="button"
              className={botaoIcone}
              aria-label={`Mover ${nome} ${posicao + 1} para antes`}
              disabled={posicao === 0}
              onClick={() => aoMudar(mover(itens, posicao, -1))}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={botaoIcone}
              aria-label={`Mover ${nome} ${posicao + 1} para depois`}
              disabled={posicao === itens.length - 1}
              onClick={() => aoMudar(mover(itens, posicao, 1))}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
              aria-label={`Remover ${nome} ${posicao + 1}`}
              onClick={() => aoMudar(itens.filter((_, indice) => indice !== posicao))}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      {itens.length < maximo && (
        <button
          type="button"
          onClick={() => aoMudar([...itens, ""])}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar {nome}
        </button>
      )}
    </div>
  );
}

/** Lista de itens com vários campos (passos, diferenciais, perguntas). */
function ListaItens<T>({
  rotulo,
  item,
  itens,
  aoMudar,
  maximo,
  minimo = 0,
  novo,
  renderizar,
}: {
  rotulo: string;
  item: string;
  itens: T[];
  aoMudar: (itens: T[]) => void;
  maximo: number;
  minimo?: number;
  novo: () => T;
  renderizar: (valor: T, mudar: (parcial: Partial<T>) => void, posicao: number) => ReactNode;
}) {
  const nome = item.toLocaleLowerCase("pt-BR");
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-brand">
        {rotulo} ({itens.length})
      </span>
      <ol className="grid gap-3">
        {itens.map((valor, posicao) => (
          <li key={posicao} className="grid gap-3 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                {item} {posicao + 1}
              </span>
              <div className="flex">
                <button
                  type="button"
                  className={botaoIcone}
                  aria-label={`Mover ${nome} ${posicao + 1} para antes`}
                  disabled={posicao === 0}
                  onClick={() => aoMudar(mover(itens, posicao, -1))}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={botaoIcone}
                  aria-label={`Mover ${nome} ${posicao + 1} para depois`}
                  disabled={posicao === itens.length - 1}
                  onClick={() => aoMudar(mover(itens, posicao, 1))}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${botaoIcone} hover:bg-perigo/10 hover:text-perigo`}
                  aria-label={`Remover ${nome} ${posicao + 1}`}
                  disabled={itens.length <= minimo}
                  onClick={() => aoMudar(itens.filter((_, indice) => indice !== posicao))}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {renderizar(
              valor,
              (parcial) =>
                aoMudar(
                  itens.map((atual, indice) =>
                    indice === posicao ? { ...atual, ...parcial } : atual,
                  ),
                ),
              posicao,
            )}
          </li>
        ))}
      </ol>
      {itens.length < maximo && (
        <button
          type="button"
          onClick={() => aoMudar([...itens, novo()])}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:underline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar {nome}
        </button>
      )}
    </div>
  );
}

function SeletorIcone({
  id,
  valor,
  aoMudar,
}: {
  id: string;
  valor: NomeIcone;
  aoMudar: (icone: NomeIcone) => void;
}) {
  return (
    <div>
      <span id={id} className="text-sm font-medium text-foreground">
        Ícone
      </span>
      <div role="radiogroup" aria-labelledby={id} className="mt-1.5 flex flex-wrap gap-2">
        {nomesIcone.map((nome) => {
          const Opcao = iconesCatalogo[nome].icone;
          return (
            <button
              key={nome}
              type="button"
              role="radio"
              aria-checked={valor === nome}
              aria-label={iconesCatalogo[nome].rotulo}
              title={iconesCatalogo[nome].rotulo}
              onClick={() => aoMudar(nome)}
              className={`flex size-9 items-center justify-center rounded-xl border transition ${valor === nome ? "border-brand bg-brand text-brand-foreground" : "border-border text-roxo hover:border-roxo/40"}`}
            >
              <Opcao className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Selo, título e texto de apoio — o topo de quase toda seção. */
function CamposCabecalho<T extends BlocoCabecalho>({
  valor,
  aoMudar,
  textoOpcional = true,
}: {
  valor: T;
  aoMudar: (parcial: Partial<BlocoCabecalho>) => void;
  textoOpcional?: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <Campo rotulo="Selo" dica="Palavra pequena acima do título.">
          <input
            value={valor.selo}
            maxLength={60}
            onChange={(evento) => aoMudar({ selo: evento.target.value })}
            className={campo}
          />
        </Campo>
        <Campo rotulo="Título">
          <input
            value={valor.titulo}
            maxLength={160}
            onChange={(evento) => aoMudar({ titulo: evento.target.value })}
            className={campo}
          />
        </Campo>
      </div>
      <Campo rotulo="Texto de apoio" opcional={textoOpcional}>
        <textarea
          rows={3}
          value={valor.texto}
          maxLength={600}
          onChange={(evento) => aoMudar({ texto: evento.target.value })}
          className={campo}
        />
      </Campo>
    </>
  );
}

/* ---------- Editores de cada seção ---------- */

export function EditorCabecalhoSecao({
  chave,
  titulo,
  descricao,
  valor,
  personalizado,
  somenteLeitura,
}: PropsEditor<BlocoCabecalho> & {
  chave: "profissionais" | "depoimentos";
  titulo: string;
  descricao: string;
}) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco(chave);
  return (
    <PainelBloco
      titulo={titulo}
      descricao={descricao}
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <CamposCabecalho
        valor={conteudo}
        aoMudar={(parcial) => setConteudo((atual) => ({ ...atual, ...parcial }))}
      />
    </PainelBloco>
  );
}

export function EditorJornada({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoJornada>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("jornada");
  const mudar = (parcial: Partial<BlocoJornada>) =>
    setConteudo((atual) => ({ ...atual, ...parcial }));
  return (
    <PainelBloco
      titulo="Como funciona"
      descricao="Seção verde com os passos do atendimento, uma foto e os diferenciais da clínica."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <CamposCabecalho valor={conteudo} aoMudar={mudar} />
      <ListaItens
        rotulo="Passos"
        item="Passo"
        itens={conteudo.passos}
        aoMudar={(passos) => mudar({ passos })}
        minimo={1}
        maximo={6}
        novo={() => ({ titulo: "", descricao: "" })}
        renderizar={(passo, mudarPasso, posicao) => (
          <>
            <Campo rotulo={`Título do passo ${posicao + 1}`}>
              <input
                value={passo.titulo}
                maxLength={80}
                onChange={(evento) => mudarPasso({ titulo: evento.target.value })}
                className={campo}
              />
            </Campo>
            <Campo rotulo="Descrição">
              <textarea
                rows={2}
                value={passo.descricao}
                maxLength={300}
                onChange={(evento) => mudarPasso({ descricao: evento.target.value })}
                className={campo}
              />
            </Campo>
          </>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <CampoImagem
          rotulo="Foto da seção"
          valor={conteudo.imagem}
          aoMudar={(imagem) => mudar({ imagem })}
        />
        <Campo
          rotulo="Descrição da foto"
          dica="Lida por leitores de tela. Diga quem ou o que aparece."
        >
          <input
            value={conteudo.descricaoImagem}
            maxLength={160}
            onChange={(evento) => mudar({ descricaoImagem: evento.target.value })}
            className={campo}
          />
        </Campo>
      </div>
      <ListaItens
        rotulo="Diferenciais (abaixo da foto)"
        item="Diferencial"
        itens={conteudo.diferenciais}
        aoMudar={(diferenciais) => mudar({ diferenciais })}
        maximo={6}
        novo={() => ({ titulo: "", descricao: "", icone: "flor" as NomeIcone })}
        renderizar={(item, mudarItem, posicao) => (
          <>
            <Campo rotulo={`Título do diferencial ${posicao + 1}`}>
              <input
                value={item.titulo}
                maxLength={60}
                onChange={(evento) => mudarItem({ titulo: evento.target.value })}
                className={campo}
              />
            </Campo>
            <Campo rotulo="Descrição">
              <textarea
                rows={2}
                value={item.descricao}
                maxLength={240}
                onChange={(evento) => mudarItem({ descricao: evento.target.value })}
                className={campo}
              />
            </Campo>
            <SeletorIcone
              id={`icone-diferencial-${posicao}`}
              valor={item.icone}
              aoMudar={(icone) => mudarItem({ icone })}
            />
          </>
        )}
      />
    </PainelBloco>
  );
}

export function EditorSobre({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoSobre>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("sobre");
  const mudar = (parcial: Partial<BlocoSobre>) =>
    setConteudo((atual) => ({ ...atual, ...parcial }));
  return (
    <PainelBloco
      titulo="Sobre a clínica"
      descricao="Apresentação da clínica, os destaques com ✓ e a foto assinada pela responsável."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <CamposCabecalho valor={conteudo} aoMudar={mudar} />
      <ListaTextos
        rotulo="Destaques"
        item="Destaque"
        itens={conteudo.destaques}
        aoMudar={(destaques) => mudar({ destaques })}
        maximo={8}
      />
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <CampoImagem
          rotulo="Foto"
          valor={conteudo.imagem}
          aoMudar={(imagem) => mudar({ imagem })}
        />
        <div className="grid content-start gap-4">
          <Campo rotulo="Nome na assinatura da foto" opcional dica="Vazio esconde a assinatura.">
            <input
              value={conteudo.nomeResponsavel}
              maxLength={80}
              onChange={(evento) => mudar({ nomeResponsavel: evento.target.value })}
              className={campo}
            />
          </Campo>
          <Campo rotulo="Cargo na assinatura" opcional>
            <input
              value={conteudo.cargoResponsavel}
              maxLength={120}
              onChange={(evento) => mudar({ cargoResponsavel: evento.target.value })}
              className={campo}
            />
          </Campo>
        </div>
      </div>
    </PainelBloco>
  );
}

function CamposCartaoLogin({
  titulo,
  valor,
  aoMudar,
}: {
  titulo: string;
  valor: BlocoLogin["profissional"];
  aoMudar: (parcial: Partial<BlocoLogin["profissional"]>) => void;
}) {
  return (
    <fieldset className="grid gap-4 rounded-2xl border border-border p-4">
      <legend className="px-1 text-sm font-semibold text-brand">{titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Selo">
          <input
            value={valor.selo}
            maxLength={60}
            onChange={(evento) => aoMudar({ selo: evento.target.value })}
            className={campo}
          />
        </Campo>
        <Campo rotulo="Título do cartão">
          <input
            value={valor.titulo}
            maxLength={60}
            onChange={(evento) => aoMudar({ titulo: evento.target.value })}
            className={campo}
          />
        </Campo>
      </div>
      <Campo rotulo="Descrição">
        <textarea
          rows={2}
          value={valor.descricao}
          maxLength={300}
          onChange={(evento) => aoMudar({ descricao: evento.target.value })}
          className={campo}
        />
      </Campo>
      <ListaTextos
        rotulo="Etiquetas"
        item="Etiqueta"
        itens={valor.recursos}
        aoMudar={(recursos) => aoMudar({ recursos })}
        maximo={6}
        maxCaracteres={40}
      />
      <Campo rotulo="Texto do botão">
        <input
          value={valor.botao}
          maxLength={40}
          onChange={(evento) => aoMudar({ botao: evento.target.value })}
          className={campo}
        />
      </Campo>
    </fieldset>
  );
}

export function EditorLogin({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoLogin>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("login");
  const mudar = (parcial: Partial<BlocoLogin>) =>
    setConteudo((atual) => ({ ...atual, ...parcial }));
  return (
    <PainelBloco
      titulo="Login"
      descricao="Os dois cartões de acesso: painel da profissional e portal do cliente. Os botões sempre levam à tela de login."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <CamposCabecalho valor={conteudo} aoMudar={mudar} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CamposCartaoLogin
          titulo="Cartão da profissional"
          valor={conteudo.profissional}
          aoMudar={(parcial) => mudar({ profissional: { ...conteudo.profissional, ...parcial } })}
        />
        <CamposCartaoLogin
          titulo="Cartão do cliente"
          valor={conteudo.cliente}
          aoMudar={(parcial) => mudar({ cliente: { ...conteudo.cliente, ...parcial } })}
        />
      </div>
    </PainelBloco>
  );
}

export function EditorDuvidas({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoDuvidas>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("duvidas");
  const mudar = (parcial: Partial<BlocoDuvidas>) =>
    setConteudo((atual) => ({ ...atual, ...parcial }));
  return (
    <PainelBloco
      titulo="Dúvidas frequentes"
      descricao="Perguntas e respostas que abrem e fecham no site."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <Campo rotulo="Selo">
          <input
            value={conteudo.selo}
            maxLength={60}
            onChange={(evento) => mudar({ selo: evento.target.value })}
            className={campo}
          />
        </Campo>
        <Campo rotulo="Título">
          <input
            value={conteudo.titulo}
            maxLength={160}
            onChange={(evento) => mudar({ titulo: evento.target.value })}
            className={campo}
          />
        </Campo>
      </div>
      <ListaItens
        rotulo="Perguntas"
        item="Pergunta"
        itens={conteudo.perguntas}
        aoMudar={(perguntas) => mudar({ perguntas })}
        minimo={1}
        maximo={20}
        novo={() => ({ pergunta: "", resposta: "" })}
        renderizar={(item, mudarItem, posicao) => (
          <>
            <Campo rotulo={`Pergunta ${posicao + 1}`}>
              <input
                value={item.pergunta}
                maxLength={200}
                onChange={(evento) => mudarItem({ pergunta: evento.target.value })}
                className={campo}
              />
            </Campo>
            <Campo rotulo="Resposta">
              <textarea
                rows={3}
                value={item.resposta}
                maxLength={1200}
                onChange={(evento) => mudarItem({ resposta: evento.target.value })}
                className={campo}
              />
            </Campo>
          </>
        )}
      />
    </PainelBloco>
  );
}

export function EditorContato({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoContato>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("contato");
  const mudar = (parcial: Partial<BlocoContato>) =>
    setConteudo((atual) => ({ ...atual, ...parcial }));
  const texto = (chave: keyof BlocoContato, maximo: number) => ({
    value: conteudo[chave],
    maxLength: maximo,
    className: campo,
    onChange: (evento: { target: { value: string } }) => mudar({ [chave]: evento.target.value }),
  });
  return (
    <PainelBloco
      titulo="Contato"
      descricao="Dados da clínica e o cartão que abre o WhatsApp. Endereço, telefone e Instagram também aparecem no rodapé, e o telefone é o número de todos os botões de WhatsApp do site."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <CamposCabecalho valor={conteudo} aoMudar={mudar} />
      <fieldset className="grid gap-4 rounded-2xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-brand">Dados da clínica</legend>
        <Campo rotulo="Endereço" dica="Clicar no site abre o Google Maps.">
          <input {...texto("endereco", 200)} />
        </Campo>
        <Campo rotulo="Horário">
          <input {...texto("horario", 160)} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Telefone / WhatsApp" dica="Com DDD. Ex.: +55 21 99999-9999">
            <input {...texto("telefone", 20)} inputMode="tel" />
          </Campo>
          <Campo rotulo="Instagram" opcional dica="Ex.: @essencial.centro">
            <input {...texto("instagram", 60)} />
          </Campo>
          <Campo rotulo="E-mail" opcional>
            <input {...texto("email", 120)} type="email" />
          </Campo>
        </div>
      </fieldset>
      <fieldset className="grid gap-4 rounded-2xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-brand">Cartão do WhatsApp</legend>
        <Campo rotulo="Título do cartão">
          <input {...texto("cartaoTitulo", 80)} />
        </Campo>
        <Campo rotulo="Texto do cartão">
          <textarea rows={2} {...texto("cartaoTexto", 400)} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Pergunta da lista de cuidados">
            <input {...texto("pergunta", 80)} />
          </Campo>
          <Campo rotulo="Texto do botão">
            <input {...texto("botao", 40)} />
          </Campo>
        </div>
        <Campo rotulo="Observação abaixo do botão" opcional>
          <textarea rows={2} {...texto("observacao", 300)} />
        </Campo>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <CampoImagem
          rotulo="Foto abaixo dos dados"
          valor={conteudo.imagem}
          aoMudar={(imagem) => mudar({ imagem })}
          opcional
        />
        <Campo rotulo="Descrição da foto" opcional>
          <input {...texto("descricaoImagem", 160)} />
        </Campo>
      </div>
    </PainelBloco>
  );
}

export function EditorRodape({ valor, personalizado, somenteLeitura }: PropsEditor<BlocoRodape>) {
  const [conteudo, setConteudo] = useState(valor);
  const bloco = useBloco("rodape");
  return (
    <PainelBloco
      titulo="Rodapé"
      descricao="Texto ao lado da logo e o aviso final. Os serviços vêm do Catálogo e os contatos, da aba Contato."
      personalizado={personalizado}
      somenteLeitura={somenteLeitura}
      bloco={bloco}
      aoSalvar={() => bloco.salvar(conteudo)}
    >
      <Campo rotulo="Texto ao lado da logo">
        <textarea
          rows={3}
          value={conteudo.descricao}
          maxLength={300}
          onChange={(evento) => setConteudo({ ...conteudo, descricao: evento.target.value })}
          className={campo}
        />
      </Campo>
      <Campo rotulo="Aviso final" opcional>
        <input
          value={conteudo.aviso}
          maxLength={160}
          onChange={(evento) => setConteudo({ ...conteudo, aviso: evento.target.value })}
          className={campo}
        />
      </Campo>
    </PainelBloco>
  );
}
