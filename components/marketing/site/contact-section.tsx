"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Clock, Phone, AtSign, Mail, ArrowUpRight, Flower2 } from "lucide-react";
import { CLINIC, CLINIC_LINKS, SERVICES, criarLinkAvaliacao } from "@/lib/marketing/clinic";
import { Field, Select } from "@/components/marketing/ui/field";

const CONTACT_ROWS: { icon: typeof MapPin; label: string; value: string; href?: string }[] = [
  { icon: MapPin, label: "Endereço", value: CLINIC.address, href: CLINIC_LINKS.address },
  { icon: Clock, label: "Horário", value: "Horário de atendimento a combinar" },
  { icon: Phone, label: "Telefone / WhatsApp", value: CLINIC.phone, href: CLINIC_LINKS.phone },
  { icon: AtSign, label: "Instagram", value: CLINIC.instagram, href: CLINIC_LINKS.instagram },
  { icon: Mail, label: "E-mail", value: CLINIC.email, href: CLINIC_LINKS.email },
];

export function ContactSection() {
  const [servico, setServico] = useState("");

  return (
    <section id="contato" className="scroll-mt-20 bg-cream-deep py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-[0.16em] text-forest uppercase">
            Contato
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            Agende sua avaliação
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-soft">
            Vamos encontrar um cuidado para o seu momento? Converse com a equipe pelo WhatsApp e
            combine sua avaliação.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Info */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <ul className="flex flex-col gap-5 text-sm">
                {CONTACT_ROWS.map((row) => (
                  <li key={row.label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sage/60 text-forest">
                      <row.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 wrap-break-word">
                      <p className="font-medium text-ink">{row.label}</p>
                      {row.href ? (
                        <a
                          href={row.href}
                          className="text-ink-soft underline-offset-4 transition-colors hover:text-forest hover:underline"
                          {...(row.href.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {row.value}
                        </a>
                      ) : (
                        <p className="text-ink-soft">{row.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden aspect-[16/9] overflow-hidden rounded-3xl border border-line sm:block">
              <Image
                src="/profissionais_modelos/dr_edmo.png"
                alt="Dr. Edmo de Souza, terapeuta ortomolecular do Essencial Centro"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Encaminhamento ao WhatsApp */}
          <div className="min-w-0 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <Flower2 className="size-9 text-roxo" strokeWidth={1.25} />
            <h3 className="mt-5 font-serif text-2xl text-brand">Seu primeiro passo começa aqui.</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Escolha uma área de interesse. Vamos abrir uma conversa com a Essencial para você
              tirar dúvidas sobre os cuidados, valores e horários.
            </p>
            <div className="mt-7">
              <Field label="Qual cuidado você procura?" htmlFor="servico">
                <Select
                  id="servico"
                  name="servico"
                  value={servico}
                  onChange={(event) => setServico(event.target.value)}
                >
                  <option value="">Quero ajuda para escolher</option>
                  {SERVICES.map((item) => (
                    <option key={item.slug} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <a
              href={criarLinkAvaliacao(servico)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand px-5 py-4 text-sm font-medium text-surface transition-colors hover:bg-roxo"
            >
              Continuar no WhatsApp
              <ArrowUpRight className="size-4" />
            </a>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Você poderá revisar e enviar a mensagem no WhatsApp. O agendamento será confirmado
              pela equipe durante a conversa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
