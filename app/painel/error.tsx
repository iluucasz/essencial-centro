"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * Pega o que `autorizarAdmin`/`autorizarEscrita` etc. lançam sem try/catch dentro de página (ex.:
 * `/painel/usuarios`, `/painel/financeiro`) — sem isso a pessoa via a tela de erro crua do Next.
 * Cabeçalho/menu continuam de pé porque o boundary só substitui `children` do layout do painel.
 */
export default function ErroPainel(_props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="size-10 text-muted" aria-hidden="true" />
      <div>
        <p className="font-heading text-lg font-semibold text-foreground">Página não disponível</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Você não tem permissão para ver isso, ou algo deu errado ao carregar a página.
        </p>
      </div>
      <Link
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:bg-brand/90"
        href="/painel"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
