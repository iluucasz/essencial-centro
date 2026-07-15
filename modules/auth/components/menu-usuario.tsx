"use client";

import { Popover } from "@heroui/react";
import { ChevronDown, LogOut } from "lucide-react";

import { sair } from "@/modules/auth/actions";
import { rotulosPapelUsuario, type PapelUsuario } from "@/modules/auth/rbac";

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "?";
}

export function MenuUsuario({
  nome,
  email,
  papel,
}: {
  nome: string;
  email: string | null;
  papel: PapelUsuario;
}) {
  return (
    <Popover>
      <Popover.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
          {iniciais(nome)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-foreground">{nome}</span>
          <span className="block text-xs text-muted">{rotulosPapelUsuario[papel]}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden="true" />
      </Popover.Trigger>

      <Popover.Content placement="bottom end">
        <Popover.Dialog className="grid w-64 gap-1 p-2">
          <div className="grid gap-0.5 px-2 py-1.5">
            <span className="text-sm font-medium text-foreground">{nome}</span>
            {email ? <span className="truncate text-xs text-muted">{email}</span> : null}
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-lilas/35 px-2 py-0.5 text-xs font-medium text-roxo">
              {rotulosPapelUsuario[papel]}
            </span>
          </div>

          <hr className="my-1 border-border" />

          <form action={sair}>
            <button
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-perigo transition hover:bg-creme"
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
