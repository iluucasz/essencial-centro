import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { ErroAutorizacao } from "@/modules/auth/rbac";
import { getMeuCliente } from "@/modules/clientes/queries";

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

export default async function DadosClientePage() {
  let cliente = null;
  let erro: string | null = null;

  try {
    cliente = await getMeuCliente();
  } catch (error) {
    if (error instanceof ErroAutorizacao) {
      erro = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] bg-creme px-6 py-8">
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-roxo hover:text-brand"
          href="/portal"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao portal
        </Link>

        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Área do cliente
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-roxo">Meus dados</h1>
          <p className="mt-2 text-sm text-foreground">
            Informações visíveis para você. Anotações internas não aparecem aqui.
          </p>
        </header>

        {erro || !cliente ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            {erro ?? "Cadastro não encontrado."}
          </div>
        ) : (
          <dl className="grid gap-4 md:grid-cols-2">
            <LinhaInfo label="Nome" valor={cliente.nome} />
            <LinhaInfo label="Data de nascimento" valor={cliente.dataNascimento} />
            <LinhaInfo label="Telefone" valor={cliente.telefone} />
            <LinhaInfo label="E-mail" valor={cliente.email} />
            <LinhaInfo label="Profissão" valor={cliente.profissao} />
            <LinhaInfo label="Objetivo do tratamento" valor={cliente.objetivoTratamento} />
            <LinhaInfo label="Alergias" valor={cliente.alergias} />
            <LinhaInfo label="Medicamentos" valor={cliente.medicamentos} />
            <LinhaInfo label="Condições de saúde" valor={cliente.condicoesSaude} />
            <LinhaInfo label="Cirurgias" valor={cliente.cirurgias} />
            <LinhaInfo label="Contraindicações" valor={cliente.contraindicacoes} />
            <LinhaInfo label="Consentimento de dados" valor={cliente.consentimentoDados} />
            <LinhaInfo label="Consentimento de imagem" valor={cliente.consentimentoImagem} />
          </dl>
        )}
      </div>
    </main>
  );
}
