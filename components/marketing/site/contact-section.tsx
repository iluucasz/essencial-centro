"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";
import { MapPin, Clock, Phone, AtSign, Mail, Check } from "lucide-react";
import { CLINIC, SERVICES } from "@/lib/marketing/clinic";
import { Field, TextInput, TextArea, Select } from "@/components/marketing/ui/field";

const CONTACT_ROWS = [
  { icon: MapPin, label: "Endereço", value: CLINIC.address },
  { icon: Clock, label: "Horário", value: "Horário de atendimento a combinar" },
  { icon: Phone, label: "Telefone / WhatsApp", value: CLINIC.phone },
  { icon: AtSign, label: "Instagram", value: CLINIC.instagram },
  { icon: Mail, label: "E-mail", value: CLINIC.email },
];

export function ContactSection() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

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
            Conte um pouco sobre o que você procura. Retornamos para confirmar o melhor horário para
            você.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Info */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-line bg-surface p-8">
              <ul className="flex flex-col gap-5 text-sm">
                {CONTACT_ROWS.map((row) => (
                  <li key={row.label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sage/60 text-forest">
                      <row.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="font-medium text-ink">{row.label}</p>
                      <p className="text-ink-soft">{row.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden aspect-[16/9] overflow-hidden rounded-3xl border border-line sm:block">
              <Image
                src="/images/treatment-detail.png"
                alt="Detalhe de um atendimento na Essencial Centro"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-line bg-surface p-8">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/15 text-forest">
                  <Check className="h-7 w-7" />
                </span>
                <h3 className="font-serif text-2xl font-semibold text-ink">Recebemos seu pedido</h3>
                <p className="max-w-sm text-sm text-ink-soft">
                  Em breve entraremos em contato pelo WhatsApp para confirmar sua avaliação.
                  Obrigada pela confiança.
                </p>
                <Button variant="outline" onPress={() => setSent(false)}>
                  Enviar outro pedido
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nome completo" htmlFor="nome" required>
                    <TextInput id="nome" name="nome" placeholder="Seu nome" required />
                  </Field>
                  <Field label="Telefone" htmlFor="tel" required>
                    <TextInput id="tel" name="tel" placeholder="(00) 00000-0000" required />
                  </Field>
                </div>
                <Field label="E-mail" htmlFor="email">
                  <TextInput id="email" name="email" type="email" placeholder="voce@email.com" />
                </Field>
                <Field label="Serviço de interesse" htmlFor="servico">
                  <Select id="servico" name="servico" defaultValue="">
                    <option value="" disabled>
                      Selecione uma opção
                    </option>
                    {SERVICES.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                    <option value="outro">Ainda não sei / outro</option>
                  </Select>
                </Field>
                <Field
                  label="Mensagem"
                  htmlFor="msg"
                  hint="Seus dados são tratados com sigilo conforme a LGPD."
                >
                  <TextArea
                    id="msg"
                    name="msg"
                    placeholder="Conte o que você gostaria de tratar..."
                  />
                </Field>
                <Button type="submit" variant="primary" size="lg" className="mt-1 w-full">
                  <Mail className="h-4 w-4" />
                  Enviar pedido de avaliação
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
