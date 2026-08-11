"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, MessageCircle, TriangleAlert } from "lucide-react";

/**
 * Exibe e-mail + senha provisória recém-criados. A senha só existe em texto claro neste retorno —
 * depois é só hash —, então o botão de copiar continua útil mesmo quando o WhatsApp já entregou tudo
 * (a profissional pode precisar repassar por outro canal, ou só conferir o que foi enviado).
 *
 * `whatsappEnviado` muda o discurso: quando a mensagem de boas-vindas já chegou ao cliente por
 * WhatsApp (ver `modules/auth/boas-vindas.ts`), dizer "repasse estes dados" seria enganoso — o
 * cadastro e o acesso já estão resolvidos do lado do cliente. Só quando o envio falha (sem telefone,
 * WhatsApp fora do ar) é que a responsabilidade de entregar a senha volta pra profissional.
 */
export function CredenciaisGeradas({
  email,
  senhaProvisoria,
  nomeCliente,
  whatsappEnviado,
}: {
  email: string;
  senhaProvisoria: string;
  nomeCliente?: string;
  whatsappEnviado: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  const textoCompleto = [
    "Acesso ao portal Essencial Centro",
    `E-mail: ${email}`,
    `Senha provisória: ${senhaProvisoria}`,
    "",
    "Na primeira entrada você vai escolher sua própria senha.",
  ].join("\n");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Área de transferência bloqueada (sem HTTPS, permissão negada): os campos seguem selecionáveis.
      setCopiado(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-4">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <KeyRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Cadastro {nomeCliente ? `de ${nomeCliente}` : ""} criado com sucesso
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {whatsappEnviado
              ? "Enviamos o e-mail e a senha provisória no WhatsApp do cliente, com o link do portal. Na primeira entrada ele define a senha dele."
              : "Não conseguimos enviar pelo WhatsApp do cliente — repasse estes dados manualmente. Na primeira entrada ele define a senha dele."}
          </p>
        </div>
      </header>

      {whatsappEnviado ? (
        <p className="flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
          <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
          Mensagem de boas-vindas enviada por WhatsApp
        </p>
      ) : null}

      <dl className="grid gap-2">
        <Linha rotulo="E-mail" valor={email} />
        <Linha rotulo="Senha provisória" valor={senhaProvisoria} destaque />
      </dl>

      {!whatsappEnviado ? (
        <p className="flex items-start gap-2 rounded-xl bg-dourado/15 px-3 py-2 text-sm text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-dourado" aria-hidden="true" />
          Guarde esta senha agora — ela não pode ser consultada depois, só substituída por uma nova.
        </p>
      ) : null}

      <button
        className="inline-flex h-10 items-center justify-center gap-2 justify-self-start rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-creme focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roxo"
        onClick={copiar}
        type="button"
      >
        {copiado ? (
          <Check className="size-4 text-brand" aria-hidden="true" />
        ) : (
          <Copy className="size-4 text-roxo" aria-hidden="true" />
        )}
        {copiado ? "Copiado!" : "Copiar e-mail e senha"}
      </button>
    </section>
  );
}

function Linha({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="grid gap-0.5 rounded-xl bg-surface px-3 py-2">
      <dt className="text-xs font-medium text-muted">{rotulo}</dt>
      {/* `select-all` porque o valor é pra ser copiado à mão quando o clipboard falha. */}
      <dd
        className={
          destaque
            ? "font-mono text-lg font-semibold tracking-wider text-brand select-all"
            : "text-sm font-semibold break-all text-foreground select-all"
        }
      >
        {valor}
      </dd>
    </div>
  );
}
