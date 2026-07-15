import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";

import { getCliente } from "@/modules/clientes/queries";
import { ListaFichas } from "@/modules/fichas/components/lista-fichas";
import { listarFichasDoCliente } from "@/modules/fichas/queries";

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
  const [cliente, fichas] = await Promise.all([getCliente(id), listarFichasDoCliente(id)]);

  if (!cliente) {
    notFound();
  }

  const observacoesInternas =
    "observacoesInternas" in cliente && typeof cliente.observacoesInternas === "string"
      ? cliente.observacoesInternas
      : null;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
        href="/painel/clientes"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para clientes
      </Link>

      <header>
        <p className="text-sm font-medium text-muted">Cadastro do cliente</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">{cliente.nome}</h1>
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
        <LinhaInfo label="Observações internas" valor={observacoesInternas} />
      </dl>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Fichas de avaliação</h2>
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href={`/painel/clientes/${id}/fichas/nova`}
          >
            <FilePlus2 className="size-4" aria-hidden="true" />
            Nova ficha
          </Link>
        </div>
        <ListaFichas fichas={fichas} />
      </section>
    </div>
  );
}
