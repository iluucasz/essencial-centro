import { CalendarClock } from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { listarProfissionaisAtivos } from "@/modules/auth/queries";
import { FormularioAgendamento } from "@/modules/agenda/components/formulario-agendamento";
import { ListaAgenda } from "@/modules/agenda/components/lista-agenda";
import { listarAgendamentosDoDia } from "@/modules/agenda/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { listarPacotesParaSelecao } from "@/modules/pacotes/queries";
import { listarServicos } from "@/modules/servicos/queries";

function paraDataInputValue(data: Date) {
  return data.toISOString().slice(0, 10);
}

function parseData(valor: string | undefined) {
  if (!valor) return new Date();

  const data = new Date(`${valor}T00:00:00`);

  return Number.isNaN(data.getTime()) ? new Date() : data;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const data = parseData(dataParam);

  const [agendamentos, clientes, servicos, profissionais, pacotes] = await Promise.all([
    listarAgendamentosDoDia(data),
    listarClientes(),
    listarServicos(),
    listarProfissionaisAtivos(),
    listarPacotesParaSelecao(),
  ]);

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <CalendarClock className="size-4" aria-hidden="true" />
            Agenda do dia
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-brand">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" }).format(data)}
          </h1>
        </div>

        <form className="flex items-center gap-2" action="/painel/agenda">
          <label className="sr-only" htmlFor="data">
            Escolher dia
          </label>
          <input
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition outline-none focus:border-roxo focus:ring-2 focus:ring-roxo/20"
            defaultValue={paraDataInputValue(data)}
            id="data"
            name="data"
            type="date"
          />
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            type="submit"
          >
            Ver dia
          </button>
        </form>
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Atendimentos</h2>
          <ModalFormulario
            icone={<CalendarClock className="size-4" aria-hidden />}
            rotuloBotao="Novo agendamento"
            titulo="Novo agendamento"
          >
            <FormularioAgendamento
              clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
              pacotes={pacotes.map((p) => ({
                id: p.id,
                nome: `${p.clienteNome} · ${p.servicoNome}`,
              }))}
              profissionais={profissionais.map((p) => ({
                id: p.id,
                nome: p.name ?? p.email ?? "",
              }))}
              servicos={servicos.map((s) => ({ id: s.id, nome: s.nome }))}
            />
          </ModalFormulario>
        </div>
        <ListaAgenda agendamentos={agendamentos} />
      </section>
    </div>
  );
}
