"use client"

import type { ReactNode } from "react"

/**
 * Campo de formulário simples e acessível (UI-only).
 * Usa os tokens de design da marca. Serve tanto para o site quanto para as áreas restritas.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  required,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-clay">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  )
}

const baseInput =
  "w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-forest focus:ring-2 focus:ring-forest/20 disabled:opacity-60"

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props
  return <input className={`${baseInput} ${className}`} {...rest} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props
  return <textarea className={`${baseInput} min-h-28 resize-y ${className}`} {...rest} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props
  return (
    <select className={`${baseInput} appearance-none ${className}`} {...rest}>
      {children}
    </select>
  )
}
