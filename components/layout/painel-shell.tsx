"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Settings,
  Sparkles,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

import { MenuUsuario } from "@/modules/auth/components/menu-usuario";
import type { PapelUsuario } from "@/modules/auth/rbac";
import { WidgetAssistente } from "@/modules/assistente/components/widget-assistente";
import type { PapelMensagemAssistente } from "@/modules/assistente/schema";

type UsuarioShell = {
  name?: string | null;
  email?: string | null;
  role: PapelUsuario;
};

type MensagemHistoricoAssistente = {
  id: string;
  papel: PapelMensagemAssistente;
  conteudo: string;
  criadoEm: Date;
};

const itensNavegacao = [
  { href: "/painel", label: "Painel", icone: LayoutDashboard, exato: true },
  { href: "/painel/agenda", label: "Agenda", icone: CalendarClock, exato: false },
  { href: "/painel/clientes", label: "Clientes", icone: UsersRound, exato: false },
  { href: "/painel/pacotes", label: "Pacotes", icone: PackageCheck, exato: false },
  { href: "/painel/servicos", label: "Serviços", icone: Sparkles, exato: false },
  {
    href: "/painel/financeiro",
    label: "Financeiro",
    icone: Wallet,
    exato: false,
    papeis: ["profissional"],
  },
  {
    href: "/painel/relatorios",
    label: "Relatórios",
    icone: BarChart3,
    exato: false,
    papeis: ["profissional"],
  },
  {
    href: "/painel/estoque",
    label: "Estoque",
    icone: Boxes,
    exato: false,
    papeis: ["profissional"],
  },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    icone: Settings,
    exato: false,
    papeis: ["profissional"],
  },
] as const;

function itemAtivo(pathname: string, href: string, exato: boolean) {
  return exato ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({
  pathname,
  papel,
  colapsada = false,
  onToggleCollapse,
  onNavigate,
}: {
  pathname: string;
  papel: PapelUsuario;
  colapsada?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Navegação do painel">
      <div
        className={
          "flex h-16 items-center px-2 " + (colapsada ? "justify-center" : "justify-between gap-3")
        }
      >
        {colapsada ? null : (
          <span className="text-lg font-semibold text-brand">Essencial Centro</span>
        )}
        {onToggleCollapse ? (
          <button
            aria-label={colapsada ? "Expandir menu" : "Recolher menu"}
            className="rounded-lg p-2 text-muted transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
            onClick={onToggleCollapse}
            title={colapsada ? "Expandir menu" : "Recolher menu"}
            type="button"
          >
            {colapsada ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {colapsada ? null : (
        <p className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wider text-muted uppercase">
          Menu
        </p>
      )}
      {itensNavegacao
        .filter((item) => !("papeis" in item) || (item.papeis as readonly string[]).includes(papel))
        .map(({ href, label, icone: Icone, exato }) => {
          const ativo = itemAtivo(pathname, href, exato);

          return (
            <Link
              key={href}
              className={
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition " +
                (colapsada ? "justify-center" : "") +
                " " +
                (ativo ? "bg-lilas/25 text-roxo" : "text-foreground hover:bg-creme")
              }
              href={href}
              onClick={onNavigate}
              title={colapsada ? label : undefined}
              aria-current={ativo ? "page" : undefined}
            >
              <Icone className="size-4 shrink-0" aria-hidden="true" />
              {colapsada ? null : label}
            </Link>
          );
        })}
    </nav>
  );
}

export function PainelShell({
  assistenteDisponivel = false,
  children,
  historicoAssistente = [],
  usuario,
}: {
  assistenteDisponivel?: boolean;
  children: ReactNode;
  historicoAssistente?: MensagemHistoricoAssistente[];
  usuario: UsuarioShell;
}) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const [colapsada, setColapsada] = useState(false);

  return (
    <div className="area-interna min-h-screen bg-creme md:flex">
      {/* Sidebar fixa (desktop) */}
      <aside
        className={
          "hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 md:block " +
          (colapsada ? "w-20" : "w-72")
        }
      >
        <Sidebar
          colapsada={colapsada}
          onToggleCollapse={() => setColapsada((atual) => !atual)}
          papel={usuario.role}
          pathname={pathname}
        />
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
            <Sidebar
              papel={usuario.role}
              pathname={pathname}
              onNavigate={() => setMenuAberto(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header fixo */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menu"
              className="rounded-lg p-2 text-foreground hover:bg-creme md:hidden"
              onClick={() => setMenuAberto(true)}
              type="button"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            <span className="hidden rounded-full bg-lilas/25 px-3 py-1 text-xs font-medium text-roxo md:inline">
              {usuario.role === "profissional" ? "Área profissional" : "Recepção"}
            </span>
          </div>

          <MenuUsuario
            email={usuario.email ?? null}
            nome={usuario.name ?? "Usuário"}
            papel={usuario.role}
          />
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>

      {assistenteDisponivel ? (
        <WidgetAssistente
          historicoInicial={historicoAssistente}
          nomeProfissional={usuario.name ?? "Profissional"}
        />
      ) : null}
    </div>
  );
}
