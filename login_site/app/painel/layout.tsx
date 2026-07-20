import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell"

const NAV: NavItem[] = [
  { label: "Visão geral", href: "/painel", icon: "dashboard" },
  { label: "Clientes", href: "/painel/clientes", icon: "users" },
  { label: "Fichas", href: "/painel/fichas", icon: "clipboard" },
  { label: "Agenda", href: "/painel/agenda", icon: "calendar" },
  { label: "Evolução", href: "/painel/evolucao", icon: "chart" },
]

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={NAV}
      role="Profissional"
      user={{ name: "Dra. Marina Reis", initials: "MR" }}
    >
      {children}
    </DashboardShell>
  )
}
