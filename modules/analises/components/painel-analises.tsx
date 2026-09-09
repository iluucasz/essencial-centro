"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  Brain,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  LoaderCircle,
  Mail,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { TextoFormatado } from "@/modules/assistente/components/texto-formatado";

import {
  blocosParaTexto,
  descricoesTipoAnalise,
  dividirEmBlocos,
  rotulosStatusRevisao,
  rotulosTipoAnalise,
  tipoExigeArquivo,
  tiposAnalise,
  type BlocoAnalise,
  type TipoAnalise,
} from "../analise";
import {
  editarAnaliseManual,
  enviarRecomendacaoEmail,
  enviarRecomendacaoWhatsApp,
  excluirAnalise,
  revisarAnalise,
  salvarObservacaoAnalise,
  type EstadoAnalise,
} from "../actions";

export type AnaliseNaTela = {
  id: string;
  tipo: TipoAnalise;
  titulo: string;
  arquivoNome: string | null;
  temArquivo: boolean;
  analiseIa: string;
  modeloIa: string;
  observacaoProfissional: string | null;
  prescricaoMedica: string | null;
  status: "rascunho" | "revisada";
  criadoEm: string;
  revisadoEm: string | null;
};

const estadoInicial: EstadoAnalise = { status: "inicial" };

const PLACEHOLDERS_TITULO: Record<TipoAnalise, string> = {
  exame: "Ex.: Hemograma de março",
  biorressonancia: "Ex.: Boletim de 06/08",
  recomendacao: "Ex.: Conduta inicial",
};

const ICONES: Record<TipoAnalise, typeof FlaskConical> = {
  exame: FlaskConical,
  biorressonancia: Brain,
  recomendacao: Sparkles,
};

/** Um dos três campos de geração. Cada um fala com a mesma rota, mudando só o `tipo`. */
function CampoGeracao({ clienteId, tipo }: { clienteId: string; tipo: TipoAnalise }) {
  const router = useRouter();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const Icone = ICONES[tipo];
  const exigeArquivo = tipoExigeArquivo(tipo);

  async function gerar() {
    setErro(null);

    if (exigeArquivo && !arquivo) {
      setErro("Escolha o PDF primeiro.");
      return;
    }

    const dados = new FormData();
    dados.set("clienteId", clienteId);
    dados.set("tipo", tipo);
    if (titulo.trim()) dados.set("titulo", titulo.trim());
    if (arquivo) dados.set("arquivo", arquivo);

    setGerando(true);

    try {
      const resposta = await fetch("/api/analises", { method: "POST", body: dados });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível gerar a análise.");
        return;
      }

      setArquivo(null);
      setTitulo("");
      if (inputArquivo.current) inputArquivo.current.value = "";
      // A análise nova é lida pelo Server Component: recarrega os dados da rota.
      router.refresh();
    } catch {
      setErro("Falha de rede ao enviar. Verifique a conexão e tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <section className="flex h-full flex-col gap-3 rounded-3xl border border-border bg-surface p-4">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lilas/25 text-roxo">
          <Icone className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-roxo">{rotulosTipoAnalise[tipo]}</h3>
          <p className="text-xs leading-relaxed text-muted">{descricoesTipoAnalise[tipo]}</p>
        </div>
      </header>

      {exigeArquivo ? (
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">Arquivo PDF</span>
          <input
            accept="application/pdf,.pdf"
            className="cursor-pointer rounded-xl border border-border bg-creme px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-roxo file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            onChange={(evento) => {
              setArquivo(evento.target.files?.[0] ?? null);
              setErro(null);
            }}
            ref={inputArquivo}
            type="file"
          />
          <span className="text-xs text-muted">
            Até 20 MB. Precisa ter texto selecionável — PDF digitalizado (imagem) não é lido.
          </span>
        </label>
      ) : (
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">De onde vêm os dados</span>
          <p className="rounded-xl border border-border bg-creme px-3 py-2 text-xs leading-relaxed text-muted">
            Não precisa de arquivo. Usa o que já está no prontuário: alergias, condições de saúde,
            contraindicações, suplementos indicados, mapa de dor e as últimas sessões.
          </p>
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Título (opcional)</span>
        <input
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          maxLength={160}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder={PLACEHOLDERS_TITULO[tipo]}
          value={titulo}
        />
      </label>

      {erro ? (
        <p className="flex items-start gap-2 text-sm font-medium text-perigo">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {erro}
        </p>
      ) : null}

      <button
        className="mt-auto inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
        disabled={gerando}
        onClick={gerar}
        type="button"
      >
        {gerando ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Analisando…
          </>
        ) : (
          <>
            <Sparkles className="size-4" aria-hidden="true" />
            Gerar análise
          </>
        )}
      </button>
    </section>
  );
}

/**
 * Pede um ajuste no texto que a IA já produziu. Vai por rota (não Server Action) porque espera o
 * modelo — mesmo motivo da geração.
 */
function AjustarComIa({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const router = useRouter();
  const [instrucao, setInstrucao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);
  const modal = useOverlayState({
    onOpenChange: (aberto) => {
      if (!aberto) {
        setInstrucao("");
        setErro(null);
      }
    },
  });

  async function enviar() {
    setErro(null);
    setAjustando(true);

    try {
      const resposta = await fetch(`/api/analises/${analise.id}/refinar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, instrucao }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => null);
        setErro(corpo?.erro ?? "Não foi possível ajustar a análise.");
        return;
      }

      modal.close();
      router.refresh();
    } catch {
      setErro("Falha de rede. Verifique a conexão e tente de novo.");
    } finally {
      setAjustando(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-roxo/30 bg-lilas/10 px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={() => modal.open()}
        type="button"
      >
        <Wand2 className="size-4" aria-hidden="true" />
        Ajustar com IA
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container size="md">
            <ConteudoModal titulo="Ajustar análise com IA">
              <div className="grid gap-4">
                <p className="text-sm leading-relaxed text-muted">
                  Descreva o que quer mudar em{" "}
                  <strong className="text-foreground">{analise.titulo}</strong>. A IA reescreve a
                  análise inteira com o ajuste aplicado, partindo do mesmo material de origem.
                </p>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-foreground">O que ajustar</span>
                  <textarea
                    autoFocus
                    className="min-h-28 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                    maxLength={1000}
                    onChange={(evento) => setInstrucao(evento.target.value)}
                    placeholder="Ex.: seja mais objetiva nos itens alterados e destaque o que se relaciona com a queixa de fadiga."
                    value={instrucao}
                  />
                  <span className="text-xs text-muted">
                    O texto anterior fica guardado, e a análise volta a não revisada — o ajuste muda
                    o conteúdo, então precisa da sua conferência de novo.
                  </span>
                </label>

                {erro ? (
                  <p className="flex items-start gap-2 text-sm font-medium text-perigo">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {erro}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-roxo px-4 text-sm font-semibold text-white transition hover:bg-roxo/90 disabled:opacity-60"
                    disabled={ajustando || instrucao.trim().length < 3}
                    onClick={enviar}
                    type="button"
                  >
                    {ajustando ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                        Ajustando…
                      </>
                    ) : (
                      <>
                        <Wand2 className="size-4" aria-hidden="true" />
                        Aplicar ajuste
                      </>
                    )}
                  </button>
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted transition hover:bg-creme"
                    onClick={() => modal.close()}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function BotaoRevisar({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const [estado, acao, enviando] = useActionState(
    async (_: EstadoAnalise, formData: FormData) => revisarAnalise(formData),
    estadoInicial,
  );

  return (
    <form action={acao}>
      <input name="id" type="hidden" value={analise.id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60 sm:w-auto"
        disabled={enviando}
        type="submit"
      >
        {enviando ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        )}
        Marcar como revisada
      </button>
      {estado.status === "erro" ? (
        <span className="sr-only" role="alert">
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}

function FormularioObservacao({
  analise,
  clienteId,
}: {
  analise: AnaliseNaTela;
  clienteId: string;
}) {
  const [estado, acao, enviando] = useActionState(salvarObservacaoAnalise, estadoInicial);

  return (
    <form action={acao} className="grid gap-2">
      <input name="id" type="hidden" value={analise.id} />
      <input name="clienteId" type="hidden" value={clienteId} />

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-foreground">Sua conclusão</span>
        <textarea
          className="min-h-24 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
          defaultValue={analise.observacaoProfissional ?? ""}
          maxLength={5000}
          name="observacaoProfissional"
          placeholder="O que você conclui, corrige ou descarta do que a IA escreveu acima."
        />
        <span className="text-xs text-muted">
          Fica guardada separado do texto da IA — o que a máquina disse não é sobrescrito.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-roxo/30 px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo disabled:opacity-60"
          disabled={enviando}
          type="submit"
        >
          {enviando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          Salvar conclusão
        </button>
        {estado.status === "sucesso" ? (
          <span className="text-xs font-medium text-brand">{estado.mensagem}</span>
        ) : null}
        {estado.status === "erro" ? (
          <span className="text-xs font-medium text-perigo">{estado.mensagem}</span>
        ) : null}
      </div>
    </form>
  );
}

function BotaoExcluir({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const [estado, acao, enviando] = useActionState(
    async (_: EstadoAnalise, formData: FormData) => excluirAnalise(formData),
    estadoInicial,
  );
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        aria-label={`Remover análise ${analise.titulo}`}
        className="rounded-lg p-2 text-muted transition hover:bg-perigo/10 hover:text-perigo"
        onClick={() => setConfirmando(true)}
        type="button"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <form action={acao} className="flex items-center gap-2">
      <input name="id" type="hidden" value={analise.id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <input name="confirmarExclusao" type="hidden" value="true" />
      <button
        className="inline-flex h-8 items-center rounded-lg bg-perigo px-3 text-xs font-semibold text-white disabled:opacity-60"
        disabled={enviando}
        type="submit"
      >
        Excluir
      </button>
      <button
        className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs text-muted"
        onClick={() => setConfirmando(false)}
        type="button"
      >
        Cancelar
      </button>
      {estado.status === "erro" ? (
        <span className="sr-only" role="alert">
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}

function BotaoEnviarWhatsApp({
  analise,
  clienteId,
}: {
  analise: AnaliseNaTela;
  clienteId: string;
}) {
  const [estado, acao, enviando] = useActionState(
    async (_: EstadoAnalise, formData: FormData) => enviarRecomendacaoWhatsApp(formData),
    estadoInicial,
  );

  return (
    <form action={acao} className="flex items-center gap-2">
      <input name="id" type="hidden" value={analise.id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-60"
        disabled={enviando}
        type="submit"
      >
        {enviando ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-3.5" aria-hidden="true" />
        )}
        Enviar por WhatsApp
      </button>
      {estado.status === "sucesso" ? (
        <span className="text-xs font-medium text-brand">{estado.mensagem}</span>
      ) : null}
      {estado.status === "erro" ? (
        <span className="text-xs font-medium text-perigo">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}

function BotaoEnviarEmail({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const [estado, acao, enviando] = useActionState(
    async (_: EstadoAnalise, formData: FormData) => enviarRecomendacaoEmail(formData),
    estadoInicial,
  );

  return (
    <form action={acao} className="flex items-center gap-2">
      <input name="id" type="hidden" value={analise.id} />
      <input name="clienteId" type="hidden" value={clienteId} />
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-roxo/30 bg-lilas/10 px-3 text-xs font-semibold text-roxo transition hover:bg-lilas/25 disabled:opacity-60"
        disabled={enviando}
        type="submit"
      >
        {enviando ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="size-3.5" aria-hidden="true" />
        )}
        Enviar por e-mail
      </button>
      {estado.status === "sucesso" ? (
        <span className="text-xs font-medium text-brand">{estado.mensagem}</span>
      ) : null}
      {estado.status === "erro" ? (
        <span className="text-xs font-medium text-perigo">{estado.mensagem}</span>
      ) : null}
    </form>
  );
}

/** Baixar/enviar o PDF só existe pra recomendação terapêutica — é o único tipo pensado pra ir ao paciente. */
function AcoesRecomendacao({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-creme/60 p-3">
      <a
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-creme"
        href={`/api/analises/${analise.id}/pdf`}
      >
        <Download className="size-3.5" aria-hidden="true" />
        Baixar PDF
      </a>
      <BotaoEnviarWhatsApp analise={analise} clienteId={clienteId} />
      <BotaoEnviarEmail analise={analise} clienteId={clienteId} />
    </div>
  );
}

type TipoCampoEditavel = "titulo" | "paragrafo" | "lista" | "prescricao";
type ItemListaEditavel = { id: string; texto: string };
/** `texto` vale pra título/parágrafo/prescrição; `itens` vale pra lista — o campo carrega os dois, só usa um. */
type CampoEditavel = {
  id: string;
  tipo: TipoCampoEditavel;
  texto: string;
  itens: ItemListaEditavel[];
};

/**
 * "Prescrição médica" fica por último de propósito — é o mesmo vocabulário de tipo que o resto
 * (Título/Parágrafo/Lista), mas o valor NUNCA entra no `blocoAnaliseSchema` que a IA usa: grava numa
 * coluna separada (`analiseClinica.prescricaoMedica`) e sai no PDF com desenho próprio, sempre por
 * último — ver `editarAnaliseManual` e `pdf-recomendacao.ts`.
 */
const ROTULOS_TIPO_CAMPO: Record<TipoCampoEditavel, string> = {
  titulo: "Título",
  paragrafo: "Parágrafo",
  lista: "Lista",
  prescricao: "Prescrição médica",
};

function novoItemLista(texto = ""): ItemListaEditavel {
  return { id: crypto.randomUUID(), texto };
}

function paraCampoEditavel(bloco: BlocoAnalise): CampoEditavel {
  if (bloco.tipo === "lista") {
    return {
      id: crypto.randomUUID(),
      tipo: "lista",
      texto: "",
      itens: bloco.itens.map((texto) => novoItemLista(texto)),
    };
  }

  return { id: crypto.randomUUID(), tipo: bloco.tipo, texto: bloco.texto, itens: [] };
}

/** Só recebe campos de conteúdo — quem chama já tirou os de tipo "prescricao" antes (ver `salvar`). */
function paraBlocoAnalise(campo: CampoEditavel): BlocoAnalise {
  if (campo.tipo === "lista") {
    const itens = campo.itens.map((item) => item.texto.trim()).filter(Boolean);

    return { tipo: "lista", itens };
  }

  if (campo.tipo === "prescricao") {
    throw new Error("Campo de prescrição não pode virar bloco de conteúdo da IA.");
  }

  return { tipo: campo.tipo, texto: campo.texto.trim() };
}

/**
 * Edição manual, campo a campo, com o TIPO de cada campo escolhido num menu — o mesmo vocabulário
 * que a IA já usa (`blocoAnaliseSchema`): Título, Parágrafo ou Lista. Diferente de "Ajustar com IA"
 * (que pede pro modelo reescrever): aqui a profissional corrige, remove ou adiciona campos
 * diretamente, sem passar pela IA de novo.
 */
function ModalEditarAnalise({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const router = useRouter();
  const [campos, setCampos] = useState<CampoEditavel[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const modal = useOverlayState({
    onOpenChange: (aberto) => {
      if (!aberto) return;

      const camposConteudo = dividirEmBlocos(analise.analiseIa).map(paraCampoEditavel);
      // A prescrição sempre entra por último — é o mesmo lugar que ela ocupa no PDF.
      const campoPrescricao: CampoEditavel[] = analise.prescricaoMedica?.trim()
        ? [
            {
              id: crypto.randomUUID(),
              tipo: "prescricao",
              texto: analise.prescricaoMedica,
              itens: [],
            },
          ]
        : [];

      setCampos([...camposConteudo, ...campoPrescricao]);
      setErro(null);
    },
  });

  /**
   * Trocar de tipo converte o conteúdo em vez de descartar: texto corrido vira um item de lista por
   * linha, e itens de lista viram linhas de um parágrafo — nada se perde ao trocar o tipo por engano.
   */
  function atualizarTipo(id: string, tipo: TipoCampoEditavel) {
    setCampos((atual) =>
      atual.map((campo) => {
        if (campo.id !== id || campo.tipo === tipo) return campo;

        if (tipo === "lista") {
          const linhas = campo.texto
            .split("\n")
            .map((linha) => linha.trim())
            .filter(Boolean);

          return { ...campo, tipo, itens: (linhas.length ? linhas : [""]).map(novoItemLista) };
        }

        if (campo.tipo === "lista") {
          return { ...campo, tipo, texto: campo.itens.map((item) => item.texto).join("\n") };
        }

        return { ...campo, tipo };
      }),
    );
  }

  function atualizarTexto(id: string, texto: string) {
    setCampos((atual) => atual.map((campo) => (campo.id === id ? { ...campo, texto } : campo)));
  }

  function atualizarItem(campoId: string, itemId: string, texto: string) {
    setCampos((atual) =>
      atual.map((campo) =>
        campo.id === campoId
          ? {
              ...campo,
              itens: campo.itens.map((item) => (item.id === itemId ? { ...item, texto } : item)),
            }
          : campo,
      ),
    );
  }

  function adicionarItem(campoId: string) {
    setCampos((atual) =>
      atual.map((campo) =>
        campo.id === campoId ? { ...campo, itens: [...campo.itens, novoItemLista()] } : campo,
      ),
    );
  }

  function removerItem(campoId: string, itemId: string) {
    setCampos((atual) =>
      atual.map((campo) =>
        campo.id === campoId
          ? { ...campo, itens: campo.itens.filter((item) => item.id !== itemId) }
          : campo,
      ),
    );
  }

  function removerCampo(id: string) {
    setCampos((atual) => atual.filter((campo) => campo.id !== id));
  }

  function adicionarCampo() {
    setCampos((atual) => [
      ...atual,
      { id: crypto.randomUUID(), tipo: "paragrafo", texto: "", itens: [] },
    ]);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);

    // Prescrição some da lista de blocos antes de virar `analiseIa` — grava numa coluna separada,
    // nunca no texto que a IA lê/reescreve. Se houver mais de um campo prescrição (raro), concatena.
    const camposConteudo = campos.filter((campo) => campo.tipo !== "prescricao");
    const prescricaoMedica = campos
      .filter((campo) => campo.tipo === "prescricao")
      .map((campo) => campo.texto.trim())
      .filter(Boolean)
      .join("\n\n");

    const formData = new FormData();
    formData.set("id", analise.id);
    formData.set("clienteId", clienteId);
    formData.set("analiseIa", blocosParaTexto(camposConteudo.map(paraBlocoAnalise)));
    formData.set("prescricaoMedica", prescricaoMedica);

    const resultado = await editarAnaliseManual(formData);
    setSalvando(false);

    if (resultado.status === "sucesso") {
      modal.close();
      router.refresh();
    } else {
      setErro(resultado.mensagem ?? "Não foi possível salvar.");
    }
  }

  return (
    <>
      <button
        aria-label={`Editar análise ${analise.titulo}`}
        className="rounded-lg p-2 text-muted transition hover:bg-lilas/25 hover:text-roxo"
        onClick={() => modal.open()}
        type="button"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>

      <Modal state={modal}>
        <Modal.Backdrop variant="opaque">
          <Modal.Container className="w-[calc(100vw-1rem)] sm:w-full" size="lg">
            <ConteudoModal titulo={`Editar — ${analise.titulo}`}>
              <div className="grid gap-4">
                <p className="text-sm leading-relaxed text-muted">
                  Escolha o tipo de cada campo, edite o texto, remova o que não fizer sentido ou
                  adicione um campo novo. Salvar substitui o texto atual — o texto original da IA
                  fica guardado.
                </p>

                <div className="grid gap-3">
                  {campos.map((campo) => (
                    <div
                      className={cn(
                        "grid gap-2 rounded-2xl border p-3",
                        campo.tipo === "prescricao"
                          ? "border-dourado/40 bg-dourado/5"
                          : "border-border bg-creme/50",
                      )}
                      key={campo.id}
                    >
                      <div className="flex items-center gap-2">
                        <select
                          className={cn(
                            "h-9 shrink-0 rounded-lg border bg-surface px-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2",
                            campo.tipo === "prescricao"
                              ? "border-dourado/40 text-dourado focus-visible:outline-dourado"
                              : "border-border text-roxo focus-visible:outline-roxo",
                          )}
                          onChange={(evento) =>
                            atualizarTipo(campo.id, evento.target.value as TipoCampoEditavel)
                          }
                          value={campo.tipo}
                        >
                          {Object.entries(ROTULOS_TIPO_CAMPO).map(([valor, rotulo]) => (
                            <option key={valor} value={valor}>
                              {rotulo}
                            </option>
                          ))}
                        </select>
                        <button
                          aria-label="Remover campo"
                          className="ml-auto shrink-0 rounded-lg p-2 text-muted transition hover:bg-perigo/10 hover:text-perigo"
                          onClick={() => removerCampo(campo.id)}
                          type="button"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>

                      {campo.tipo === "prescricao" ? (
                        <>
                          <textarea
                            className="min-h-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dourado"
                            onChange={(evento) => atualizarTexto(campo.id, evento.target.value)}
                            placeholder={
                              "Ex.: Pscovit — 10 borrifadas 3x ao dia.\nUsar por 12 semanas."
                            }
                            value={campo.texto}
                          />
                          <span className="text-xs text-muted">
                            Só você escreve aqui — a IA nunca prescreve. Sai no PDF numa página
                            própria, com desenho diferente do resto.
                          </span>
                        </>
                      ) : campo.tipo === "titulo" ? (
                        <input
                          className="h-9 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                          onChange={(evento) => atualizarTexto(campo.id, evento.target.value)}
                          placeholder="Título da seção"
                          value={campo.texto}
                        />
                      ) : campo.tipo === "lista" ? (
                        <div className="grid gap-1.5">
                          {campo.itens.map((item) => (
                            <div className="flex items-center gap-1.5" key={item.id}>
                              <span aria-hidden="true" className="shrink-0 text-muted">
                                •
                              </span>
                              <input
                                className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                                onChange={(evento) =>
                                  atualizarItem(campo.id, item.id, evento.target.value)
                                }
                                value={item.texto}
                              />
                              <button
                                aria-label="Remover item"
                                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-perigo/10 hover:text-perigo"
                                onClick={() => removerItem(campo.id, item.id)}
                                type="button"
                              >
                                <X className="size-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                          <button
                            className="inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-muted transition hover:bg-creme"
                            onClick={() => adicionarItem(campo.id)}
                            type="button"
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                            Item
                          </button>
                        </div>
                      ) : (
                        <textarea
                          className="min-h-16 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
                          onChange={(evento) => atualizarTexto(campo.id, evento.target.value)}
                          value={campo.texto}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-roxo/30 bg-lilas/10 px-4 text-sm font-semibold text-roxo transition hover:bg-lilas/25"
                  onClick={adicionarCampo}
                  type="button"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Adicionar campo
                </button>

                {erro ? (
                  <p className="flex items-start gap-2 text-sm font-medium text-perigo">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {erro}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-roxo px-4 text-sm font-semibold text-white transition hover:bg-roxo/90 disabled:opacity-60"
                    disabled={salvando}
                    onClick={salvar}
                    type="button"
                  >
                    {salvando ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Salvar
                  </button>
                  <button
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted transition hover:bg-creme"
                    onClick={() => modal.close()}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </ConteudoModal>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function CartaoAnalise({ analise, clienteId }: { analise: AnaliseNaTela; clienteId: string }) {
  const Icone = ICONES[analise.tipo];
  const rascunho = analise.status === "rascunho";

  return (
    <article
      className={cn(
        "grid gap-3 rounded-3xl border bg-surface p-4",
        rascunho ? "border-dourado/40" : "border-border",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lilas/25 text-roxo">
            <Icone className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground">{analise.titulo}</h4>
            <p className="text-xs text-muted">
              {rotulosTipoAnalise[analise.tipo]} · {analise.criadoEm}
              {analise.revisadoEm ? ` · revisada em ${analise.revisadoEm}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ModalEditarAnalise analise={analise} clienteId={clienteId} />
          <BotaoExcluir analise={analise} clienteId={clienteId} />
        </div>
      </header>

      <p
        className={cn(
          "flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium",
          rascunho ? "bg-dourado/10 text-dourado" : "bg-brand/5 text-brand",
        )}
      >
        {rascunho ? (
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        )}
        {rotulosStatusRevisao[analise.status]}
      </p>

      {analise.temArquivo ? (
        <a
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:underline"
          href={`/api/analises/${analise.id}/arquivo`}
          rel="noreferrer"
          target="_blank"
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          {analise.arquivoNome ?? "Abrir PDF original"}
        </a>
      ) : null}

      <div className="rounded-2xl bg-creme p-3 text-sm leading-relaxed text-foreground">
        {/* `ehUsuario`/`aoClicarLink` são do chat; aqui é texto da IA sem link de cliente. */}
        <TextoFormatado aoClicarLink={() => {}} ehUsuario={false} texto={analise.analiseIa} />
      </div>

      <p className="text-xs text-muted">
        Gerado por IA ({analise.modeloIa}) como apoio à decisão — não é diagnóstico nem prescrição.
      </p>

      {analise.tipo === "recomendacao" ? (
        <AcoesRecomendacao analise={analise} clienteId={clienteId} />
      ) : null}

      {/* Separadores: o campo acima é a conclusão DELA; a barra abaixo age sobre a análise da IA. */}
      <hr className="border-border/70" />

      <FormularioObservacao analise={analise} clienteId={clienteId} />

      <hr className="border-border/70" />

      <footer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AjustarComIa analise={analise} clienteId={clienteId} />

        {rascunho ? (
          <BotaoRevisar analise={analise} clienteId={clienteId} />
        ) : (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Revisada — um ajuste com IA pede nova conferência
          </span>
        )}
      </footer>
    </article>
  );
}

export function PainelAnalises({
  clienteId,
  analises,
  iaConfigurada,
}: {
  clienteId: string;
  analises: AnaliseNaTela[];
  iaConfigurada: boolean;
}) {
  return (
    <div className="grid gap-5">
      {!iaConfigurada ? (
        <p className="flex items-start gap-2 rounded-2xl border border-dourado/40 bg-dourado/10 p-3 text-sm font-medium text-dourado">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />A análise por IA
          está desligada porque `DEEPSEEK_API_KEY` não está configurada. As análises já registradas
          continuam visíveis.
        </p>
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {tiposAnalise.map((tipo) => (
          <CampoGeracao clienteId={clienteId} key={tipo} tipo={tipo} />
        ))}
      </div>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-roxo">
          Análises registradas{analises.length > 0 ? ` (${analises.length})` : ""}
        </h3>

        {analises.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            Nenhuma análise ainda. Importe um exame ou gere uma recomendação acima.
          </p>
        ) : (
          <div className="grid gap-4">
            {analises.map((analise) => (
              <CartaoAnalise analise={analise} clienteId={clienteId} key={analise.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
