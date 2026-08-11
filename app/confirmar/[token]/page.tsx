import type { ReactNode } from "react";
import { CalendarCheck, CheckCircle2, Clock, TriangleAlert, XCircle } from "lucide-react";

import { situacaoDoContrato } from "@/modules/agenda/confirmacao";
import { obterContratoPorTokenConfirmacao } from "@/modules/agenda/confirmacao-queries";
import { FormularioConfirmacao } from "@/modules/agenda/components/formulario-confirmacao";

export const metadata = {
  title: "Confirmar atendimentos — Essencial Centro",
};

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full justify-center bg-creme px-4 py-10">
      <div className="w-full max-w-xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <CalendarCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted">Essencial Centro</p>
            <p className="text-lg font-semibold text-brand">Confirmação de atendimentos</p>
          </div>
        </header>
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          {children}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Dúvidas? Responda no WhatsApp da Essencial Centro.
        </p>
      </div>
    </main>
  );
}

function Aviso({
  icone,
  titulo,
  texto,
  tom = "muted",
}: {
  icone: ReactNode;
  titulo: string;
  texto: string;
  tom?: "brand" | "muted" | "perigo";
}) {
  const cor = tom === "brand" ? "text-brand" : tom === "perigo" ? "text-perigo" : "text-foreground";

  return (
    <div className="grid justify-items-center gap-3 py-6 text-center">
      <span className={`flex size-14 items-center justify-center rounded-full bg-creme ${cor}`}>
        {icone}
      </span>
      <h1 className={`text-lg font-semibold ${cor}`}>{titulo}</h1>
      <p className="max-w-sm text-sm text-muted">{texto}</p>
    </div>
  );
}

export default async function ConfirmarAgendamentosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contrato = await obterContratoPorTokenConfirmacao(token);

  if (!contrato) {
    return (
      <Moldura>
        <Aviso
          icone={<TriangleAlert className="size-7" aria-hidden="true" />}
          titulo="Link inválido"
          texto="Este link de confirmação não foi encontrado. Confirme com a clínica se ele está correto."
          tom="perigo"
        />
      </Moldura>
    );
  }

  const situacao = situacaoDoContrato(contrato);
  const primeiroNome = contrato.clienteNome.trim().split(/\s+/)[0] || contrato.clienteNome;

  if (situacao.estado === "confirmado") {
    return (
      <Moldura>
        <Aviso
          icone={<CheckCircle2 className="size-7" aria-hidden="true" />}
          titulo="Já está confirmado"
          texto="Você já confirmou estas datas. Avisaremos 1 dia antes de cada sessão e enviaremos o QR Code de presença no dia do atendimento."
          tom="brand"
        />
      </Moldura>
    );
  }

  if (situacao.estado === "recusado") {
    return (
      <Moldura>
        <Aviso
          icone={<XCircle className="size-7" aria-hidden="true" />}
          titulo="Recusa já registrada"
          texto="Registramos que essas datas não servem. A clínica vai entrar em contato para remarcar."
        />
      </Moldura>
    );
  }

  if (situacao.estado === "expirado" || situacao.estado === "invalido") {
    return (
      <Moldura>
        <Aviso
          icone={<Clock className="size-7" aria-hidden="true" />}
          titulo="Link expirado"
          texto="Este link não está mais válido. Fale com a clínica para confirmar seus atendimentos."
        />
      </Moldura>
    );
  }

  return (
    <Moldura>
      <FormularioConfirmacao
        token={token}
        servicoNome={contrato.servicoNome}
        primeiroNome={primeiroNome}
        sessoes={contrato.sessoes.map(({ inicio, duracaoMinutos }) => ({
          inicio,
          duracaoMinutos,
        }))}
      />
    </Moldura>
  );
}
