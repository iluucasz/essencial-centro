"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@heroui/react"
import { Stethoscope, HeartHandshake, LogIn } from "lucide-react"
import { Field, TextInput } from "@/components/ui/field"

type Profile = "profissional" | "cliente"

export function AccessForm() {
  const router = useRouter()
  const params = useSearchParams()
  const initial = (params.get("perfil") as Profile) || "cliente"
  const [profile, setProfile] = useState<Profile>(
    initial === "profissional" ? "profissional" : "cliente",
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(profile === "profissional" ? "/painel" : "/minha-jornada")
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="font-serif text-3xl font-semibold text-ink">Entrar</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Escolha seu perfil e acesse sua área. (Demonstração — nenhum dado é enviado.)
      </p>

      {/* Profile switch */}
      <div
        className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-1.5"
        role="tablist"
        aria-label="Selecione o perfil"
      >
        <ProfileTab
          active={profile === "cliente"}
          onClick={() => setProfile("cliente")}
          icon={<HeartHandshake className="h-4 w-4" />}
          label="Cliente"
        />
        <ProfileTab
          active={profile === "profissional"}
          onClick={() => setProfile("profissional")}
          icon={<Stethoscope className="h-4 w-4" />}
          label="Profissional"
        />
      </div>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="E-mail" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            defaultValue={
              profile === "profissional"
                ? "profissional@essencialcentro.com.br"
                : "cliente@email.com"
            }
            placeholder="voce@email.com"
          />
        </Field>
        <Field label="Senha" htmlFor="senha">
          <TextInput id="senha" type="password" defaultValue="demonstracao" />
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-soft">
            <input type="checkbox" className="h-4 w-4 rounded border-line accent-[oklch(0.46_0.055_158)]" />
            Manter conectada
          </label>
          <button type="button" className="font-medium text-forest hover:underline">
            Esqueci a senha
          </button>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full">
          <LogIn className="h-4 w-4" />
          Acessar {profile === "profissional" ? "painel" : "meu tratamento"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Primeiro acesso? Sua senha inicial é enviada pela clínica ao cadastrar seu tratamento.
      </p>
    </div>
  )
}

function ProfileTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-forest text-cream" : "text-ink-soft hover:bg-sage/50"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
