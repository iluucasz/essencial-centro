import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { usuario } from "@/modules/auth/schema";
import { cliente } from "@/modules/clientes/schema";

import { enviarEmailNotificacao, urlBaseNotificacoes } from "./email";
import { notificacao, type TipoNotificacao } from "./schema";
import { canalDesativado, type ResultadoNotificacao } from "./tipos";
import { enviarWhatsAppMidia, enviarWhatsAppTexto } from "./whatsapp";

/**
 * Usado internamente por outros módulos (agenda, sessões…) logo após uma ação real do usuário —
 * não é uma Server Action chamada por formulário. Se o cliente não tiver conta no portal, não faz
 * nada (nem todo cadastro de cliente tem login vinculado). Além do canal in-app, tenta reforçar
 * por e-mail (Brevo) e WhatsApp (Evolution API) em paralelo — nenhum dos dois é bloqueante: se
 * um falhar ou não estiver configurado, o outro (e o registro in-app, que já aconteceu) seguem
 * normalmente. Nunca desfaz a ação principal (agendamento, sessão etc.) por causa de um canal de
 * reforço.
 */
export async function notificarCliente(params: {
  clienteId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link?: string;
  /** Quando presente, o canal WhatsApp envia esta imagem (base64 puro) com a mensagem como legenda — ex.: o QR de presença. */
  whatsappImagemBase64?: string;
}): Promise<ResultadoNotificacao> {
  const [usuarioCliente] = await db
    .select({ id: usuario.id, email: usuario.email, nome: usuario.name })
    .from(usuario)
    .where(and(eq(usuario.clienteId, params.clienteId), eq(usuario.role, "cliente")))
    .limit(1);

  if (!usuarioCliente) {
    return { email: canalDesativado, whatsapp: canalDesativado };
  }

  await db.insert(notificacao).values({
    destinatarioId: usuarioCliente.id,
    tipo: params.tipo,
    titulo: params.titulo,
    mensagem: params.mensagem,
    link: params.link,
  });

  const [registroCliente] = await db
    .select({ telefone: cliente.telefone })
    .from(cliente)
    .where(eq(cliente.id, params.clienteId))
    .limit(1);

  // Mesmo link absoluto que o e-mail usa no botão "Acessar no portal" — sem isso o WhatsApp nunca
  // trazia link nenhum, só o texto solto.
  const linkCompleto = params.link ? `${urlBaseNotificacoes()}${params.link}` : null;
  const mensagemWhatsapp = [`${params.titulo}\n\n${params.mensagem}`, linkCompleto]
    .filter(Boolean)
    .join("\n\n");

  const [resultadoEmail, resultadoWhatsapp] = await Promise.all([
    enviarEmailNotificacao({
      destinatarioEmail: usuarioCliente.email,
      destinatarioNome: usuarioCliente.nome ?? "Cliente",
      titulo: params.titulo,
      mensagem: params.mensagem,
      link: params.link,
    }),
    registroCliente?.telefone
      ? params.whatsappImagemBase64
        ? enviarWhatsAppMidia({
            telefone: registroCliente.telefone,
            media: params.whatsappImagemBase64,
            mediatype: "image",
            mimetype: "image/png",
            legenda: mensagemWhatsapp,
            nomeArquivo: "qr-presenca.png",
          })
        : enviarWhatsAppTexto({
            telefone: registroCliente.telefone,
            mensagem: mensagemWhatsapp,
          })
      : Promise.resolve(canalDesativado),
  ]);

  return { email: resultadoEmail, whatsapp: resultadoWhatsapp };
}
