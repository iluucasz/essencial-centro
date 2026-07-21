"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { buttonVariants } from "@heroui/react";
import { Logo } from "./logo";
import { NAV_LINKS } from "@/lib/marketing/clinic";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/entrar" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <LogIn className="h-4 w-4" />
            Login
          </Link>
          <Link href="/#contato" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Agendar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-cream md:hidden">
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4"
            aria-label="Navegação mobile"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink-soft transition-colors hover:bg-sage hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/entrar"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline", fullWidth: true })}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/#contato"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "primary", fullWidth: true })}
              >
                Ir para contato
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
