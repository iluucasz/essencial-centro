import { PageHeader } from "@/components/dashboard/ui"
import { CLIENT_DOCUMENTS } from "@/lib/data"
import { FileText, Download, PenLine, ShieldCheck } from "lucide-react"

export default function DocumentosPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Meus documentos"
        subtitle="Termos, autorizações e fichas do seu tratamento — tudo em um só lugar."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-forest/20 bg-sage/30 p-4 text-sm text-ink-soft">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-forest" strokeWidth={1.75} />
        <p className="leading-relaxed">
          Seus dados de saúde são tratados com sigilo e segurança, em conformidade com a LGPD. Você
          pode solicitar a exclusão dos seus dados a qualquer momento.
        </p>
      </div>

      <ul className="space-y-3">
        {CLIENT_DOCUMENTS.map((doc) => (
          <li
            key={doc.name}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage/50 text-forest">
              <FileText className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-ink">{doc.name}</p>
              <p className="text-sm text-ink-soft">
                {doc.type} · {doc.date}
              </p>
            </div>
            {doc.signed ? (
              <span className="rounded-full bg-sage/60 px-3 py-1 text-xs font-medium text-forest">
                Assinado
              </span>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-cream transition-opacity hover:opacity-90"
              >
                <PenLine className="h-3.5 w-3.5" /> Assinar
              </button>
            )}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sage/40 hover:text-forest"
              aria-label={`Baixar ${doc.name}`}
            >
              <Download className="h-4.5 w-4.5" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
