"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Clock, Phone, AtSign, Mail, ArrowUpRight, Flower2 } from "lucide-react";
import { SERVICES, criarLinkAvaliacao } from "@/lib/marketing/clinic";
import { Field, Select } from "@/components/marketing/ui/field";
import {
  blocoContatoPadrao,
  linksContato,
  numeroWhatsapp,
  type BlocoContato,
} from "@/modules/site-publico/blocos";

export function ContactSection({
  categorias = SERVICES.map((servico) => servico.name),
  conteudo = blocoContatoPadrao,
}: {
  /** Nomes das categorias do catálogo editável — mesma lista mostrada na seção de serviços. */
  categorias?: string[];
  conteudo?: BlocoContato;
}) {
  const [servico, setServico] = useState("");
  const links = linksContato(conteudo);
  const linhas = [
    { icone: MapPin, rotulo: "Endereço", valor: conteudo.endereco, href: links.endereco },
    { icone: Clock, rotulo: "Horário", valor: conteudo.horario, href: "" },
    { icone: Phone, rotulo: "Telefone / WhatsApp", valor: conteudo.telefone, href: links.whatsapp },
    { icone: AtSign, rotulo: "Instagram", valor: conteudo.instagram, href: links.instagram },
    { icone: Mail, rotulo: "E-mail", valor: conteudo.email, href: links.email },
  ].filter((linha) => linha.valor);

  return (
    <section id="contato" className="scroll-mt-20 bg-cream-deep py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-[0.16em] text-forest uppercase">
            {conteudo.selo}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
            {conteudo.titulo}
          </h2>
          {conteudo.texto && (
            <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-soft">
              {conteudo.texto}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Info */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <ul className="flex flex-col gap-5 text-sm">
                {linhas.map((linha) => (
                  <li key={linha.rotulo} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-sage/60 text-forest">
                      <linha.icone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 wrap-break-word">
                      <p className="font-medium text-ink">{linha.rotulo}</p>
                      {linha.href ? (
                        <a
                          href={linha.href}
                          className="text-ink-soft underline-offset-4 transition-colors hover:text-forest hover:underline"
                          {...(linha.href.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {linha.valor}
                        </a>
                      ) : (
                        <p className="text-ink-soft">{linha.valor}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {conteudo.imagem && (
              <div className="relative hidden aspect-video overflow-hidden rounded-3xl border border-line sm:block">
                <Image
                  src={conteudo.imagem}
                  alt={conteudo.descricaoImagem}
                  fill
                  unoptimized={conteudo.imagem.startsWith("https:")}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-top"
                />
              </div>
            )}
          </div>

          {/* Encaminhamento ao WhatsApp */}
          <div className="min-w-0 rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <Flower2 className="size-9 text-roxo" strokeWidth={1.25} />
            <h3 className="mt-5 font-serif text-2xl text-brand">{conteudo.cartaoTitulo}</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">{conteudo.cartaoTexto}</p>
            <div className="mt-7">
              <Field label={conteudo.pergunta} htmlFor="servico">
                <Select
                  id="servico"
                  name="servico"
                  value={servico}
                  onChange={(event) => setServico(event.target.value)}
                >
                  <option value="">Quero ajuda para escolher</option>
                  {categorias.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <a
              href={criarLinkAvaliacao(servico, numeroWhatsapp(conteudo.telefone))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand px-5 py-4 text-sm font-medium text-surface transition-colors hover:bg-roxo"
            >
              {conteudo.botao}
              <ArrowUpRight className="size-4" />
            </a>
            {conteudo.observacao && (
              <p className="mt-4 text-xs leading-relaxed text-muted">{conteudo.observacao}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
