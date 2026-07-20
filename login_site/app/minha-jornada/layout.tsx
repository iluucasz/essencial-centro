import { DashboardShell, type NavItem } from "@/components/dashboard/dashboard-shell"

const NAV: NavItem[] = [
  { label: "Meu tratamento", href: "/minha-jornada", icon: "heart" },
  { label: "Minha evolução", href: "/minha-jornada/evolucao", icon: "chart" },
  { label: "Documentos", href: "/minha-jornada/documentos", icon: "file" },
]

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={NAV}
      role="Cliente"
      user={{ name: "Ana Souza", initials: "AS" }}
    >
      {children}
    </DashboardShell>
  )
}
