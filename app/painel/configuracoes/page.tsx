import { CheckCircle2, Mail, MessageCircle, XCircle } from "lucide-react";

import { FormularioAlterarSenha } from "@/modules/auth/components/formulario-alterar-senha";
import { FormularioMeuPerfil } from "@/modules/auth/components/formulario-meu-perfil";
import { exigirUsuarioAtualComImagem } from "@/modules/auth/queries";
import { rotulosPapelUsuario } from "@/modules/auth/rbac";
import { MenuFotoUsuario } from "@/modules/fotos/components/menu-foto-usuario";
import { FormularioTesteEmail } from "@/modules/notificacoes/components/formulario-teste-email";
import { FormularioTesteWhatsApp } from "@/modules/notificacoes/components/formulario-teste-whatsapp";
import { consultarStatusConexaoEmail } from "@/modules/notificacoes/email";
import { consultarStatusConexaoWhatsApp } from "@/modules/notificacoes/whatsapp";

function getIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "?";
}

export default async function ConfiguracoesPage() {
  const usuarioAtual = await exigirUsuarioAtualComImagem(["profissional"]);

  const [statusWhatsApp, statusEmail] = await Promise.all([
    consultarStatusConexaoWhatsApp(),
    consultarStatusConexaoEmail(),
  ]);

  const nome = usuarioAtual.name ?? "Usuário";
  const email = usuarioAtual.email ?? "";
  const temFoto = Boolean(usuarioAtual.image);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Configurações</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Seu perfil, segurança da conta e diagnóstico de integrações — área interna, não visível ao
          cliente.
        </p>
      </header>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Meu perfil</h2>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-16 shrink-0">
            {usuarioAtual.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem privada servida via rota autenticada, sem otimização estática do Next */}
                <img
                  alt={`Foto de ${nome}`}
                  className="size-16 rounded-2xl object-cover"
                  src={`/api/usuarios/${usuarioAtual.id}/foto?v=${encodeURIComponent(usuarioAtual.image)}`}
                />
              </>
            ) : (
              <span className="flex size-16 items-center justify-center rounded-2xl bg-brand text-xl font-semibold text-brand-foreground">
                {getIniciais(nome)}
              </span>
            )}
            <MenuFotoUsuario temFoto={temFoto} usuarioId={usuarioAtual.id} usuarioNome={nome} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{nome}</p>
            <p className="truncate text-sm text-muted">{email}</p>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-lilas/35 px-2 py-0.5 text-xs font-medium text-roxo">
              {rotulosPapelUsuario[usuarioAtual.role]}
            </span>
          </div>
        </div>

        <div className="border-t border-border/70 pt-4">
          <FormularioMeuPerfil email={email} nome={nome} />
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          <p className="mt-1 text-sm text-muted">Alterar sua senha exige informar a senha atual.</p>
        </div>

        <FormularioAlterarSenha />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Integrações</h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageCircle className="size-4 text-muted" aria-hidden="true" />
              WhatsApp (Evolution API)
            </h3>

            <div className="grid gap-2 rounded-xl border border-border bg-creme/40 p-4">
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="size-4 text-muted" aria-hidden="true" />
                <span className="font-medium text-foreground">
                  {statusWhatsApp.configured
                    ? `Instância: ${statusWhatsApp.instance}`
                    : "Não configurado"}
                </span>
              </div>

              {statusWhatsApp.configured ? (
                <div className="flex items-center gap-2 text-sm">
                  {statusWhatsApp.connected ? (
                    <>
                      <CheckCircle2 className="size-4 text-brand" aria-hidden="true" />
                      <span className="text-brand">Conectado</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-perigo" aria-hidden="true" />
                      <span className="text-perigo">
                        Desconectado{statusWhatsApp.error ? ` — ${statusWhatsApp.error}` : ""}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no ambiente.
                </p>
              )}
            </div>

            {statusWhatsApp.configured ? (
              <div className="grid gap-3 border-t border-border/70 pt-4">
                <h4 className="text-sm font-semibold text-foreground">Enviar mensagem de teste</h4>
                <FormularioTesteWhatsApp />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="size-4 text-muted" aria-hidden="true" />
              E-mail (Brevo)
            </h3>

            <div className="grid gap-2 rounded-xl border border-border bg-creme/40 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted" aria-hidden="true" />
                <span className="font-medium text-foreground">
                  {statusEmail.configured
                    ? `Remetente: ${statusEmail.remetente}`
                    : "Não configurado"}
                </span>
              </div>

              {statusEmail.configured ? (
                <div className="flex items-center gap-2 text-sm">
                  {statusEmail.connected ? (
                    <>
                      <CheckCircle2 className="size-4 text-brand" aria-hidden="true" />
                      <span className="text-brand">Chave válida</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-perigo" aria-hidden="true" />
                      <span className="text-perigo">
                        Falha na verificação{statusEmail.error ? ` — ${statusEmail.error}` : ""}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Configure BREVO_API_KEY e BREVO_SENDER_EMAIL no ambiente.
                </p>
              )}
            </div>

            {statusEmail.configured ? (
              <div className="grid gap-3 border-t border-border/70 pt-4">
                <h4 className="text-sm font-semibold text-foreground">Enviar e-mail de teste</h4>
                <FormularioTesteEmail />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
