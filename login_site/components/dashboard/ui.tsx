import type { ReactNode } from "react"
import type { ClientStatus } from "@/lib/data"

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change?: string
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-6">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-2xl text-ink sm:text-3xl">{value}</p>
      {change ? <p className="mt-1 text-xs text-ink-soft">{change}</p> : null}
    </div>
  )
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-6 ${className}`}>{children}</div>
  )
}

const STATUS_STYLES: Record<ClientStatus, string> = {
  Ativa: "bg-forest/12 text-forest",
  Avaliação: "bg-clay/15 text-clay",
  Concluída: "bg-sage-deep/40 text-ink-soft",
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sage/60">
        <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-soft">
        {done}/{total}
      </span>
    </div>
  )
}
