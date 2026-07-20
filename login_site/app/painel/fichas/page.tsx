"use client"

import { useState } from "react"
import { Button } from "@heroui/react"
import { ClipboardList, ChevronRight, Plus } from "lucide-react"
import { PageHeader, Panel } from "@/components/dashboard/ui"
import { SERVICES } from "@/lib/clinic"
import { Field, TextInput, TextArea, Select } from "@/components/ui/field"

export default function FichasPage() {
  const [selected, setSelected] = useState(SERVICES[0].slug)
  const active = SERVICES.find((s) => s.slug === selected)!
  const [gestante, setGestante] = useState("nao")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fichas de anamnese"
        subtitle="Modelos inteligentes por serviço, com campos que se adaptam às respostas."
        action={
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            Novo modelo
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Templates list */}
        <Panel className="p-0">
          <p className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
            Modelos por serviço
          </p>
          <ul className="p-2">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(s.slug)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    selected === s.slug
                      ? "bg-forest text-cream"
                      : "text-ink-soft hover:bg-sage/40"
                  }`}
                >
                  <s.icon className="h-4 w-4 flex-none" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <ChevronRight className="h-4 w-4 flex-none opacity-60" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Form preview */}
        <Panel>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-forest" />
            <h2 className="font-serif text-lg font-semibold text-ink">
              Ficha — {active.name}
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Pré-visualização do formulário enviado à cliente antes do atendimento.
          </p>

          <form className="mt-6 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome completo" required>
                <TextInput placeholder="Preenchido pela cliente" />
              </Field>
              <Field label="Data de nascimento">
                <TextInput type="date" />
              </Field>
            </div>

            <Field label="Queixa principal / objetivo" required>
              <TextArea placeholder="O que a cliente deseja tratar?" />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="É gestante ou lactante?">
                <Select value={gestante} onChange={(e) => setGestante(e.target.value)}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </Select>
              </Field>
              {/* Campo condicional */}
              {gestante === "sim" && (
                <Field label="Semanas de gestação" hint="Campo exibido apenas quando aplicável">
                  <TextInput placeholder="Ex.: 22 semanas" />
                </Field>
              )}
            </div>

            <Field label="Histórico de saúde relevante">
              <TextArea placeholder="Cirurgias, doenças crônicas, medicações em uso..." />
            </Field>

            <Field label="Possui alergias?">
              <TextInput placeholder="Descreva ou informe 'não'" />
            </Field>

            <div className="flex items-start gap-3 rounded-xl bg-sage/30 p-4">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line accent-[oklch(0.46_0.055_158)]" />
              <p className="text-sm text-ink-soft">
                Autorizo o registro de fotografias para acompanhamento clínico (autorização de uso em
                redes sociais é solicitada separadamente).
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button">
                Enviar para cliente
              </Button>
              <Button variant="primary" type="submit">
                Salvar ficha
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  )
}
