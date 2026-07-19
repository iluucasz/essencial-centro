import { eq } from "drizzle-orm";

import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";

import { precisaLembreteDiaAnterior, precisaLembreteHorasAntes } from "./lembretes";
import { listarAgendamentosParaLembretes } from "./queries";
import { agendamento } from "./schema";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Chamado só pela rota `app/api/cron/lembretes` — nunca por uma action de formulário. */
export async function dispararLembretes() {
  const agora = agoraBrasilia();
  const candidatos = await listarAgendamentosParaLembretes();

  let diaAnteriorEnviados = 0;
  let horasAntesEnviados = 0;

  for (const item of candidatos) {
    if (precisaLembreteDiaAnterior(item, agora)) {
      await notificarCliente({
        clienteId: item.clienteId,
        tipo: "lembrete_dia_anterior",
        titulo: "Lembrete: atendimento amanhã",
        mensagem: `Seu atendimento de ${item.servicoNome} está marcado para ${formatadorDataHora.format(item.inicio)}.`,
        link: "/portal/agendamentos",
      });

      await db
        .update(agendamento)
        .set({ lembreteDiaAnteriorEm: agora })
        .where(eq(agendamento.id, item.id));

      diaAnteriorEnviados += 1;
    }

    if (precisaLembreteHorasAntes(item, agora)) {
      await notificarCliente({
        clienteId: item.clienteId,
        tipo: "lembrete_horas_antes",
        titulo: "Lembrete: atendimento em breve",
        mensagem: `Seu atendimento de ${item.servicoNome} é hoje, ${formatadorDataHora.format(item.inicio)}.`,
        link: "/portal/agendamentos",
      });

      await db
        .update(agendamento)
        .set({ lembreteHorasAntesEm: agora })
        .where(eq(agendamento.id, item.id));

      horasAntesEnviados += 1;
    }
  }

  return { candidatosAnalisados: candidatos.length, diaAnteriorEnviados, horasAntesEnviados };
}
