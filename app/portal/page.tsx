import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  ClipboardList,
  FileText,
  IdCard,
  ImageIcon,
  Leaf,
  NotebookPen,
  Ruler,
  TrendingUp,
} from "lucide-react";

import { BotaoSair } from "@/modules/auth/components/botao-sair";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { listarMinhasNotificacoes } from "@/modules/notificacoes/queries";

function primeiroNomeDe(nomeOuEmail: string) {
  return nomeOuEmail.trim().split(/\s+/)[0] || nomeOuEmail;
}

function CartaoNav({
  href,
  icone: Icone,
  titulo,
  descricao,
}: {
  href: string;
  icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link
      className="group flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-roxo/30 hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:p-5"
      href={href}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lilas/35 text-roxo transition group-hover:bg-lilas/50">
        <Icone aria-hidden={true} className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{titulo}</span>
        <span className="mt-0.5 block text-xs break-words text-muted">{descricao}</span>
      </span>
    </Link>
  );
}

export default async function PortalPage() {
  const usuario = await exigirUsuarioAtual(["cliente"]);
  const notificacoes = await listarMinhasNotificacoes();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const primeiroNome = primeiroNomeDe(usuario.name ?? usuario.email ?? "Cliente");

  return (
    <main className="area-interna mx-auto min-h-screen w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">Essencial Centro</p>
            <h1 className="truncate text-xl font-semibold text-roxo sm:text-2xl">
              Olá, {primeiroNome}!
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            aria-label="Notificações"
            className="relative inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            href="/portal/notificacoes"
          >
            <Bell className="size-4" aria-hidden="true" />
            {naoLidas > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-perigo text-xs font-semibold text-white">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            ) : null}
          </Link>
          <BotaoSair />
        </div>
      </header>

      <Link
        className="mt-6 flex items-center gap-3 rounded-2xl bg-brand p-5 text-brand-foreground transition hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo sm:mt-8"
        href="/portal/evolucao"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <TrendingUp className="size-6" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-semibold">Minha jornada</span>
          <span className="block text-sm break-words text-brand-foreground/80">
            Sessões, medidas, dor, fotos e pacotes — tudo em um só lugar.
          </span>
        </span>
      </Link>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <CartaoNav
          descricao="Veja e confirme seus próximos atendimentos"
          href="/portal/agendamentos"
          icone={CalendarClock}
          titulo="Meus agendamentos"
        />
        <CartaoNav
          descricao="Histórico de atendimentos realizados"
          href="/portal/sessoes"
          icone={NotebookPen}
          titulo="Minhas sessões"
        />
        <CartaoNav
          descricao="Acompanhe sua evolução corporal"
          href="/portal/medidas"
          icone={Ruler}
          titulo="Minhas medidas"
        />
        <CartaoNav
          descricao="Registre onde e como você sente dor"
          href="/portal/dor"
          icone={Activity}
          titulo="Meu mapa de dor"
        />
        <CartaoNav
          descricao="Fotos de antes e depois do tratamento"
          href="/portal/fotos"
          icone={ImageIcon}
          titulo="Minhas fotos"
        />
        <CartaoNav
          descricao="Formulários e anamneses preenchidos"
          href="/portal/fichas"
          icone={ClipboardList}
          titulo="Minhas fichas"
        />
        <CartaoNav
          descricao="Termos assinados e orientações"
          href="/portal/documentos"
          icone={FileText}
          titulo="Meus documentos"
        />
        <CartaoNav
          descricao="Cadastro, contato e preferências"
          href="/portal/dados"
          icone={IdCard}
          titulo="Meus dados"
        />
      </div>
    </main>
  );
}
