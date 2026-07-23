"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { enviarFichaPublica } from "@/modules/fichas/actions";
import type { CampoModelo } from "@/modules/fichas/campos";

import { FormularioDinamico } from "./formulario-dinamico";

export function FormularioFichaPublica({
  token,
  campos,
  modeloNome,
  clientePrimeiroNome,
}: {
  token: string;
  campos: CampoModelo[];
  modeloNome: string;
  clientePrimeiroNome: string;
}) {
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <div className="grid justify-items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-brand">Ficha enviada!</h2>
        <p className="max-w-sm text-sm text-muted">
          Obrigada, {clientePrimeiroNome}. Suas respostas foram enviadas com segurança para a
          Essencial Centro. Pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <FormularioDinamico
      aoEnviar={async ({ respostas }) => {
        const resultado = await enviarFichaPublica({ token, respostas });

        if (resultado.status === "sucesso") setEnviado(true);

        return resultado;
      }}
      campos={campos}
      exigirConfirmacao
      rotuloEnviar="Enviar ficha"
      textoConfirmacao={`Enviar sua ficha de ${modeloNome}? Confira suas respostas antes de confirmar.`}
    />
  );
}
