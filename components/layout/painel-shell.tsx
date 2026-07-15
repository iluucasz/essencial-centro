"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, LayoutDashboard, Menu, Sparkles, UsersRound, X } from "lucide-react";

import { BotaoSair } from "@/modules/auth/components/botao-sair";
import type { PapelUsuario } from "@/modules/auth/rbac";

type UsuarioShell = {
  name?: string | null;
  email?: string | null;
  role: PapelUsuario;
};

const itensNavegacao = [
  { href: "/painel", label: "Painel", icone: LayoutDashboard, exato: true },
  { href: "/painel/agenda", label: "Agenda", icone: CalendarClock, exato: false },
  { href: "/painel/clientes", label: "Clientes", icone: UsersRound, exato: false },
  { href: "/painel/servicos", label: "Serviços", icone: Sparkles, exato: false },
] as const;

function itemAtivo(pathname: string, href: string, exato: boolean) {
  return exato ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Navegação do painel">
      <div className="flex h-16 items-center px-2">
        <span className="text-lg font-semibold text-brand">Essencial Centro</span>
      </div>

      <p className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider text-muted uppercase">
        Menu
      </p>
      {itensNavegacao.map(({ href, label, icone: Icone, exato }) => {
        const ativo = itemAtivo(pathname, href, exato);

        return (
          <Link
            key={href}
            className={
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition " +
              (ativo ? "bg-lilas/25 text-roxo" : "text-foreground hover:bg-creme")
            }
            href={href}
            onClick={onNavigate}
            aria-current={ativo ? "page" : undefined}
          >
            <Icone className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PainelShell({ children, usuario }: { children: ReactNode; usuario: UsuarioShell }) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-creme md:flex">
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-surface md:block">
        <Sidebar pathname={pathname} />
      </aside>

      {/* Sidebar deslizante (mobile) */}
      {menuAberto ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
            type="button"
          />
          <div className="relative flex h-full w-72 flex-col border-r border-border bg-surface">
            <button
              aria-label="Fechar menu"
              className="absolute top-4 right-4 rounded-lg p-2 text-muted hover:bg-creme"
              onClick={() => setMenuAberto(false)}
              type="button"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <Sidebar pathname={pathname} onNavigate={() => setMenuAberto(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header fixo */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
          <button
            aria-label="Abrir menu"
            className="rounded-lg p-2 text-foreground hover:bg-creme md:hidden"
            onClick={() => setMenuAberto(true)}
            type="button"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <span className="hidden text-sm text-muted md:inline">
            {usuario.role === "profissional" ? "Área profissional" : "Recepção"}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {usuario.name ?? usuario.email}
            </span>
            <BotaoSair />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
