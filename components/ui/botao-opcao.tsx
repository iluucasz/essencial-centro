import type { ReactNode } from "react";

/** Cartão-botão de escolha dentro de modal (ícone + título + descrição), ex.: "Preencher" ou "Enviar". */
export function BotaoOpcao({
  icone,
  titulo,
  descricao,
  onClick,
}: {
  icone: ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-roxo/30 hover:bg-lilas/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilas/20 text-roxo transition group-hover:bg-roxo group-hover:text-white">
        {icone}
      </span>
      <span>
        <span className="block font-semibold text-foreground">{titulo}</span>
        <span className="mt-0.5 block text-sm text-muted">{descricao}</span>
      </span>
    </button>
  );
}
