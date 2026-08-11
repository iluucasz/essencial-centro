import { eq } from "drizzle-orm";

import { db } from "@/db";
import { agoraBrasilia } from "@/lib/utils";
import { notificarCliente } from "@/modules/notificacoes/criar-notificacao";

import { mensagemQrDoDia } from "./confirmacao";
import { precisaLembreteDiaAnterior, precisaLembreteHorasAntes } from "./lembretes";
import { qrCheckinBase64 } from "./qr-whatsapp";
import { urlCheckin } from "./checkin-url";
import { listarAgendamentosParaLembretes } from "./queries";
import { agendamento } from "./schema";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

/** `inicio` guarda horário de parede nos campos UTC (ver interpretarDataHoraParede) — daí timeZone UTC. */
const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
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
      /*
        O lembrete do dia leva o QR de presença anexado — foi o que a clínica prometeu ao pedir a
        confirmação ("no dia enviamos seu QR Code; apresente na recepção"). O texto ainda traz o link
        do check-in, pra funcionar mesmo quando o WhatsApp está fora e só o e-mail sai.
      */
      await notificarCliente({
        clienteId: item.clienteId,
        tipo: "lembrete_horas_antes",
        titulo: "Lembrete: atendimento hoje",
        mensagem: mensagemQrDoDia({
          primeiroNome: item.clienteNome.trim().split(/\s+/)[0] ?? item.clienteNome,
          hora: formatadorHora.format(item.inicio),
          urlQr: await urlCheckin(item.id),
        }),
        link: "/portal/agendamentos",
        whatsappImagemBase64: await qrCheckinBase64(item.id),
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
