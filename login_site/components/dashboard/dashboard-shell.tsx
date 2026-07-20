"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  LogOut,
  Bell,
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  ChartLine,
  Sparkles,
  FileText,
  HeartHandshake,
} from "lucide-react"
import { Logo } from "@/components/site/logo"

export type NavIcon =
  | "dashboard"
  | "users"
  | "clipboard"
  | "calendar"
  | "chart"
  | "sparkles"
  | "file"
  | "heart"

const ICONS: Record<NavIcon, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  users: Users,
  clipboard: ClipboardList,
  calendar: CalendarDays,
  chart: ChartLine,
  sparkles: Sparkles,
  file: FileText,
  heart: HeartHandshake,
}

export type NavItem = {
  label: string
  href: string
  icon: NavIcon
}

export function DashboardShell({
  nav,
  user,
  role,
  children,
}: {
  nav: NavItem[]
  user: { name: string; initials: string }
  role: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream-deep lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-line bg-surface transition-transform lg:static lg:z-auto lg:flex lg:translate-x-0 ${
          open ? "flex translate-x-0" : "hidden -translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-ink-soft lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Menu do painel">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft/60">
            {role}
          </p>
          {nav.map((item) => {
            const active = pathname === item.href
            const Icon = ICONS[item.icon]
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-forest text-cream"
                    : "text-ink-soft hover:bg-sage/40 hover:text-forest"
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-sage/40 hover:text-forest"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-cream/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-ink lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sage/40"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-clay" />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
                {user.initials}
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
                <p className="text-xs leading-tight text-ink-soft">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
