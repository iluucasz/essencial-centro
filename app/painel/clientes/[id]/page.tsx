import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FilePlus2,
  Fingerprint,
  FileText,
  ImagePlus,
  NotebookPen,
  Pill,
  Ruler,
  TrendingUp,
} from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { listarAgendamentosDoCliente } from "@/modules/agenda/queries";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { ListaBiometrias } from "@/modules/biometria/components/lista-biometrias";
import { FormularioGerarCodigo } from "@/modules/biometria/components/formulario-gerar-codigo";
import { listarBiometriasDoCliente } from "@/modules/biometria/queries";
import { registrarConsentimentoBiometria } from "@/modules/clientes/actions";
import { getCliente } from "@/modules/clientes/queries";
import { FormularioDocumento } from "@/modules/documentos/components/formulario-documento";
import { ListaDocumentos } from "@/modules/documentos/components/lista-documentos";
import { listarDocumentosDoCliente } from "@/modules/documentos/queries";
import { FormularioFichaEsteticaCorporal } from "@/modules/fichas/components/formulario-ficha-estetica-corporal";
import { ListaFichas } from "@/modules/fichas/components/lista-fichas";
import { listarFichasDoCliente } from "@/modules/fichas/queries";
import { FormularioFoto } from "@/modules/fotos/components/formulario-foto";
import { GaleriaFotos } from "@/modules/fotos/components/galeria-fotos";
import { listarFotosDoCliente } from "@/modules/fotos/queries";
import { FormularioMedida } from "@/modules/medidas/components/formulario-medida";
import { TabelaEvolucao } from "@/modules/medidas/components/tabela-evolucao";
import { listarEvolucaoDoCliente } from "@/modules/medidas/queries";
import { FormularioMedicamento } from "@/modules/medicamentos/components/formulario-medicamento";
import { ListaMedicamentos } from "@/modules/medicamentos/components/lista-medicamentos";
import { listarMedicamentosDoCliente } from "@/modules/medicamentos/queries";
import { listarPacotesParaSelecao } from "@/modules/pacotes/queries";
import { listarServicos } from "@/modules/servicos/queries";
import { FormularioSessao } from "@/modules/sessoes/components/formulario-sessao";
import { ListaSessoes } from "@/modules/sessoes/components/lista-sessoes";
import { listarSessoesDoCliente } from "@/modules/sessoes/queries";

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

function LinhaInfo({ label, valor }: { label: string; valor?: Date | string | boolean | null }) {
  if (valor === null || valor === undefined || valor === "") return null;

  const texto =
    valor instanceof Date
      ? formatarData(valor)
      : typeof valor === "boolean"
        ? valor
          ? "Sim"
          : "Não"
        : valor;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{texto}</dd>
    </div>
  );
}

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const [cliente, fichas, biometrias] = await Promise.all([
    getCliente(id),
    listarFichasDoCliente(id),
    listarBiometriasDoCliente(id),
  ]);

  if (!cliente) {
    notFound();
  }

  const dadosSessoes =
    usuario.role === "profissional"
      ? await Promise.all([
          listarSessoesDoCliente(id),
          listarServicos(),
          listarAgendamentosDoCliente(id),
          listarPacotesParaSelecao(),
        ])
      : null;

  const evolucaoMedidas =
    usuario.role === "profissional" ? await listarEvolucaoDoCliente(id) : null;

  const fotos = usuario.role === "profissional" ? await listarFotosDoCliente(id) : null;

  const documentos = usuario.role === "profissional" ? await listarDocumentosDoCliente(id) : null;

  const medicamentos =
    usuario.role === "profissional" ? await listarMedicamentosDoCliente(id) : null;

  const observacoesInternas =
    "observacoesInternas" in cliente && typeof cliente.observacoesInternas === "string"
      ? cliente.observacoesInternas
      : null;

  const sessoesParaSelecao = dadosSessoes
    ? dadosSessoes[0].map((s) => ({
        id: s.id,
        nome: `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(s.dataHora)} · ${s.regiaoTratada ?? "Sessão"}`,
      }))
    : [];

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href="/painel/clientes"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para clientes
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Cadastro do cliente</p>
          <h1 className="mt-2 text-2xl font-semibold text-brand">{cliente.nome}</h1>
        </div>

        {usuario.role === "profissional" ? (
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-roxo transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href={`/painel/clientes/${id}/evolucao`}
          >
            <TrendingUp className="size-4" aria-hidden="true" />
            Ver evolução
          </Link>
        ) : null}
      </header>

      <dl className="grid gap-4 md:grid-cols-2">
        <LinhaInfo label="Data de nascimento" valor={cliente.dataNascimento} />
        <LinhaInfo label="Telefone" valor={cliente.telefone} />
        <LinhaInfo label="E-mail" valor={cliente.email} />
        <LinhaInfo label="Profissão" valor={cliente.profissao} />
        <LinhaInfo label="Endereço" valor={cliente.endereco} />
        <LinhaInfo label="Contato de emergência" valor={cliente.contatoEmergenciaNome} />
        <LinhaInfo label="Telefone de emergência" valor={cliente.contatoEmergenciaTelefone} />
        <LinhaInfo label="Objetivo do tratamento" valor={cliente.objetivoTratamento} />
        <LinhaInfo label="Alergias" valor={cliente.alergias} />
        <LinhaInfo label="Medicamentos" valor={cliente.medicamentos} />
        <LinhaInfo label="Condições de saúde" valor={cliente.condicoesSaude} />
        <LinhaInfo label="Cirurgias" valor={cliente.cirurgias} />
        <LinhaInfo label="Contraindicações" valor={cliente.contraindicacoes} />
        <LinhaInfo label="Consentimento de dados" valor={cliente.consentimentoDados} />
        <LinhaInfo label="Consentimento de imagem" valor={cliente.consentimentoImagem} />
        <LinhaInfo label="Consentimento de biometria" valor={cliente.consentimentoBiometria} />
        <LinhaInfo label="Observações internas" valor={observacoesInternas} />
      </dl>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Fichas de avaliação</h2>
          {usuario.role === "profissional" ? (
            <ModalFormulario
              icone={<FilePlus2 className="size-4" aria-hidden />}
              rotuloBotao="Nova ficha"
              titulo="Anamnese — estética corporal"
            >
              <FormularioFichaEsteticaCorporal
                clienteId={id}
                clienteNome={cliente.nome}
                servicos={
                  dadosSessoes ? dadosSessoes[1].map((s) => ({ id: s.id, nome: s.nome })) : []
                }
              />
            </ModalFormulario>
          ) : null}
        </div>
        <ListaFichas fichas={fichas} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Biometria</h2>

        {!cliente.consentimentoBiometria ? (
          <form action={registrarConsentimentoBiometria} className="flex flex-wrap gap-3">
            <input name="clienteId" type="hidden" value={id} />
            <input name="consentimento" type="hidden" value="true" />
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-roxo transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
              type="submit"
            >
              <Fingerprint className="size-4" aria-hidden="true" />
              Registrar consentimento de biometria
            </button>
          </form>
        ) : (
          <ModalFormulario
            icone={<Fingerprint className="size-4" aria-hidden />}
            rotuloBotao="Gerar código de cadastro"
            titulo="Cadastro de digital"
          >
            <FormularioGerarCodigo clienteId={id} />
          </ModalFormulario>
        )}

        <ListaBiometrias biometrias={biometrias} clienteId={id} />
      </section>

      {dadosSessoes ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Sessões realizadas</h2>
            <ModalFormulario
              icone={<NotebookPen className="size-4" aria-hidden />}
              rotuloBotao="Nova sessão"
              titulo="Nova sessão"
            >
              <FormularioSessao
                agendamentos={dadosSessoes[2].map((a) => ({
                  id: a.id,
                  nome: `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(a.inicio)} · ${a.servicoNome}`,
                }))}
                clienteId={id}
                pacotes={dadosSessoes[3].map((p) => ({ id: p.id, nome: p.servicoNome }))}
                servicos={dadosSessoes[1].map((s) => ({ id: s.id, nome: s.nome }))}
              />
            </ModalFormulario>
          </div>
          <ListaSessoes sessoes={dadosSessoes[0]} />
        </section>
      ) : null}

      {dadosSessoes && evolucaoMedidas ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Evolução de medidas</h2>
            <ModalFormulario
              icone={<Ruler className="size-4" aria-hidden />}
              rotuloBotao="Nova medida"
              titulo="Nova medida"
            >
              <FormularioMedida clienteId={id} sessoes={sessoesParaSelecao} />
            </ModalFormulario>
          </div>
          <TabelaEvolucao evolucao={evolucaoMedidas} />
        </section>
      ) : null}

      {dadosSessoes && fotos ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Fotos</h2>
            <ModalFormulario
              icone={<ImagePlus className="size-4" aria-hidden />}
              rotuloBotao="Nova foto"
              titulo="Nova foto"
            >
              <FormularioFoto clienteId={id} sessoes={sessoesParaSelecao} />
            </ModalFormulario>
          </div>
          <GaleriaFotos fotos={fotos} />
        </section>
      ) : null}

      {documentos ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Documentos e termos</h2>
            <ModalFormulario
              icone={<FileText className="size-4" aria-hidden />}
              rotuloBotao="Novo documento"
              titulo="Emitir documento"
            >
              <FormularioDocumento clienteId={id} />
            </ModalFormulario>
          </div>
          <ListaDocumentos clienteId={id} documentos={documentos} />
        </section>
      ) : null}

      {medicamentos ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Medicamentos informados e alertas de segurança
            </h2>
            <ModalFormulario
              icone={<Pill className="size-4" aria-hidden />}
              rotuloBotao="Novo medicamento"
              titulo="Registrar medicamento"
            >
              <FormularioMedicamento clienteId={id} />
            </ModalFormulario>
          </div>
          <ListaMedicamentos clienteId={id} medicamentos={medicamentos} />
        </section>
      ) : null}
    </div>
  );
}
