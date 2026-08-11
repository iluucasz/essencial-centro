"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import {
  Brain,
  CheckCircle2,
  FileText,
  FlaskConical,
  LoaderCircle,
  Paperclip,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
} from "lucide-react";

import { ConteudoModal } from "@/components/ui/modal-formulario";
import { cn } from "@/lib/utils";
import { TextoFormatado } from "@/modules/assistente/components/texto-formatado";

import {
  descricoesTipoAnalise,
  rotulosStatusRevisao,
  rotulosTipoAnalise,
  tipoExigeArquivo,
  tiposAnalise,
  type TipoAnalise,
} from "../analise";
import {
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
        <BotaoExcluir analise={analise} clienteId={clienteId} />
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
          está desligada porque `GROQ_API_KEY` não está configurada. As análises já registradas
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
