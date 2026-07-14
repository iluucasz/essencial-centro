---
description: Cria um novo módulo de feature seguindo a arquitetura do projeto
argument-hint: <nome-do-modulo> (ex.: clientes, agenda, servicos)
---

Crie o módulo de feature **$ARGUMENTS** seguindo estritamente as convenções do projeto.

Antes de escrever qualquer código:

1. Leia `docs/context/03-convencoes.md` (receita de feature, naming, actions, testes) e
   `docs/context/02-arquitetura.md` (padrões de dados). Se o módulo lida com dado clínico,
   leia também `docs/context/06-lgpd-seguranca.md`.
2. Consulte `docs/context/01-dominio.md` para as entidades/campos corretos deste módulo.

Depois, gere em `modules/$ARGUMENTS/`:

- `schema.ts` — tabela(s) Drizzle + schemas Zod (drizzle-zod). Reexporte a tabela em `db/schema/index.ts`.
- `queries.ts` — leituras server-only, já com checagem de `role`/posse quando o dado for sensível.
- `actions.ts` — Server Actions (`"use server"`): sessão → autorização → validação Zod → mutação → revalidate.
- `components/` — só se a tarefa pedir UI; use primitivos de `@/components/ui` e tokens da marca.
- `$ARGUMENTS.test.ts` — teste da regra de negócio principal **e** da autorização.

Regras: textos/domínio em pt-BR, nomes claros, nada de hex solto na UI, sem `console.log`.

Ao final, rode `pnpm check` e só conclua com tudo verde. Não use `--no-verify`.
Se mudou domínio/arquitetura, atualize o doc correspondente do context bank.
