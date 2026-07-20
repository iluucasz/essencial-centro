"use client"

import { useState } from "react"
import { FileText, CheckCircle2, AlertCircle, Activity } from "lucide-react"
import { Panel } from "@/components/dashboard/ui"
import { MeasurementChart } from "@/components/dashboard/measurement-chart"
import { SESSION_HISTORY, CLIENT_DOCUMENTS, MEASUREMENTS } from "@/lib/data"

const TABS = ["Evolução", "Sessões", "Ficha", "Documentos"] as const
type Tab = (typeof TABS)[number]

export function ClientRecordTabs() {
  const [tab, setTab] = useState<Tab>("Evolução")

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? "bg-forest text-cream" : "text-ink-soft hover:bg-sage/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Evolução" && <EvolutionTab />}
      {tab === "Sessões" && <SessionsTab />}
      {tab === "Ficha" && <RecordTab />}
      {tab === "Documentos" && <DocumentsTab />}
    </div>
  )
}

function EvolutionTab() {
  const first = MEASUREMENTS[0]
  const last = MEASUREMENTS[MEASUREMENTS.length - 1]
  const deltas = [
    { label: "Cintura", diff: last.cintura - first.cintura, unit: "cm" },
    { label: "Abdômen", diff: last.abdomen - first.abdomen, unit: "cm" },
    { label: "Quadril", diff: last.quadril - first.quadril, unit: "cm" },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Panel>
        <h2 className="font-serif text-lg font-semibold text-ink">Evolução de medidas</h2>
        <p className="mt-1 text-sm text-ink-soft">Comparativo por sessão (em centímetros).</p>
        <div className="mt-6">
          <MeasurementChart />
        </div>
      </Panel>
      <Panel>
        <h2 className="font-serif text-lg font-semibold text-ink">Resultados acumulados</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {deltas.map((d) => (
            <li key={d.label} className="flex items-center justify-between">
              <span className="text-sm text-ink-soft">{d.label}</span>
              <span className="flex items-center gap-1.5 font-serif text-lg font-semibold text-forest">
                {d.diff} {d.unit}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl bg-sage/40 p-4 text-sm text-forest-deep">
          <Activity className="mb-2 h-5 w-5" />
          Redução total de {Math.abs(deltas.reduce((s, d) => s + d.diff, 0))} cm ao longo de 6 sessões.
        </div>
      </Panel>
    </div>
  )
}

function SessionsTab() {
  return (
    <Panel className="p-0">
      <ul className="divide-y divide-line">
        {SESSION_HISTORY.map((log) => (
          <li key={log.date} className="flex gap-4 p-6">
            <div className="flex flex-col items-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/60 text-xs font-semibold text-forest">
                {log.session.replace("Sessão ", "S")}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{log.session}</p>
                <span className="text-sm text-ink-soft">{log.date}</span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{log.note}</p>
              {log.pain !== undefined && (
                <p className="mt-2 text-xs text-ink-soft">
                  Escala de dor:{" "}
                  <span className="font-medium text-clay">{log.pain}/10</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function RecordTab() {
  const fields = [
    { label: "Queixa principal", value: "Gordura localizada na região abdominal e retenção." },
    { label: "Histórico de saúde", value: "Sem comorbidades. Não faz uso de medicação contínua." },
    { label: "Alergias", value: "Nega alergias conhecidas." },
    { label: "Gestante / lactante", value: "Não" },
    { label: "Prática de atividade física", value: "Caminhada 3x por semana." },
    { label: "Objetivo do tratamento", value: "Redução de medidas e melhora da firmeza da pele." },
  ]
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-forest" />
        <h2 className="font-serif text-lg font-semibold text-ink">Anamnese corporal</h2>
      </div>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
              {f.label}
            </dt>
            <dd className="mt-1 text-sm text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function DocumentsTab() {
  return (
    <Panel className="p-0">
      <ul className="divide-y divide-line">
        {CLIENT_DOCUMENTS.map((doc) => (
          <li key={doc.name} className="flex items-center gap-4 p-5">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-sage/60 text-forest">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{doc.name}</p>
              <p className="text-xs text-ink-soft">
                {doc.type} · {doc.date}
              </p>
            </div>
            {doc.signed ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-forest">
                <CheckCircle2 className="h-4 w-4" />
                Assinado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-clay">
                <AlertCircle className="h-4 w-4" />
                Pendente
              </span>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
