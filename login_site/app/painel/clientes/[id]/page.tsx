import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CLIENTS } from "@/lib/data"
import { StatusBadge, ProgressBar } from "@/components/dashboard/ui"
import { ClientRecordTabs } from "@/components/dashboard/client-record-tabs"

export function generateStaticParams() {
  return CLIENTS.map((c) => ({ id: c.id }))
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = CLIENTS.find((c) => c.id === id)
  if (!client) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/painel/clientes"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para clientes
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest text-xl font-semibold text-cream">
              {client.initials}
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink">{client.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                <span>{client.service}</span>
                <span className="text-ink-soft/40">·</span>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <ProgressBar done={client.sessionsDone} total={client.sessionsTotal} />
            {client.nextVisit ? (
              <p className="text-sm text-ink-soft">
                Próxima sessão: <span className="font-medium text-ink">{client.nextVisit}</span>
              </p>
            ) : (
              <p className="text-sm text-ink-soft">Sem sessões agendadas</p>
            )}
          </div>
        </div>
      </div>

      <ClientRecordTabs />
    </div>
  )
}
