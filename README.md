# Essencial Centro

Plataforma de gestão e acompanhamento clínico (estética facial/corporal, massoterapia, estética
integrativa, ozonioterapia e pré/pós-operatório), com área da **profissional** e do **cliente**.

> Documentação de domínio, arquitetura e convenções: **[`docs/context/`](docs/context/README.md)**.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Neon (Postgres) + Drizzle ORM ·
Auth.js v5 · react-hook-form + Zod · pnpm.

## Estrutura

```
app/          roteamento (App Router)
components/   design system compartilhado
modules/      features de domínio (unidade de escala)
db/           Drizzle: cliente, schema, migrations
lib/          utilitários transversais
config/       constantes (site, marca)
docs/context/ context bank do projeto
```

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local   # preencha DATABASE_URL e AUTH_SECRET
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

`pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm format` · `pnpm test` ·
`pnpm check` (todos os portões) · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:push` · `pnpm db:studio`

## Fluxo com agente (Claude Code)

Config em `.claude/`: allowlist de permissões (menos prompts) e slash commands do projeto:

- **`/iniciar`** — comando principal. Constrói o **próximo** módulo do MVP na ordem certa e diz
  qual é o próximo passo. Auto-avançável: é só rodar `/iniciar` de novo a cada etapa, sem decorar a sequência.
- `/modulo <nome>` — cria um módulo específico fora de ordem (schema, queries, actions, teste).
- `/check` — roda `pnpm check`.

O padrão obrigatório do agente está em [`AGENTS.md`](AGENTS.md).
