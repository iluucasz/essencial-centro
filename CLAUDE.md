# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
pnpm dev                 # servidor de desenvolvimento (localhost:3000)
pnpm build               # build de produção
pnpm typecheck           # tsc --noEmit
pnpm lint                # ESLint
pnpm format              # Prettier --write (formata; ordena classes Tailwind)
pnpm format:check        # Prettier --check (não escreve)
pnpm test                # Vitest, roda uma vez
pnpm test:watch          # Vitest em watch
pnpm check               # typecheck + lint + format:check + test — rodar antes de finalizar qualquer tarefa

# Drizzle / Neon
pnpm db:generate         # gera migration a partir do schema em db/schema
pnpm db:migrate          # aplica migrations pendentes
pnpm db:push             # sincroniza schema direto (sem gerar migration) — só em dev
pnpm db:studio           # UI do Drizzle Studio
```

**Rodar um teste específico**: `pnpm test <caminho-ou-parte-do-nome>`, ex. `pnpm test lib/utils`.
Por nome do teste: `pnpm exec vitest run -t "nome do teste"`.

**Pre-commit (Husky + lint-staged)** roda automaticamente em todo commit (lint --fix + prettier nos
arquivos staged, depois `pnpm typecheck`) e **aborta o commit se falhar**. Não use `--no-verify`.

### Slash commands do projeto (`.claude/commands/`)

- `/iniciar` — condutor do MVP: detecta o próximo módulo pela ordem do roadmap
  (`docs/context/04-roadmap.md`), constrói-o e informa o próximo passo. É o ponto de entrada padrão.
- `/modulo <nome>` — cria um módulo específico fora de ordem.
- `/check` — roda `pnpm check`.

## Arquitetura

Next.js 16 App Router + React 19 + TypeScript strict, sem pasta `src/` (alias `@/*` → raiz).
⚠️ Esta versão do Next tem breaking changes — ver aviso no topo do `AGENTS.md` antes de mexer em rotas/APIs.

### Organização por módulo de domínio (não por tipo técnico)

Toda feature vive em `modules/<nome>/` (ver `modules/README.md` e `docs/context/03-convencoes.md`):

```
modules/<nome>/
  schema.ts        # tabelas Drizzle + schemas Zod (drizzle-zod)
  queries.ts       # leituras — Server Components, server-only
  actions.ts       # Server Actions ("use server") — mutações
  components/      # UI específica do módulo
```

`components/` (raiz) é só o design system compartilhado entre módulos; `lib/` é utilitário
transversal sem estado de domínio. Nada de import cruzado entre módulos por caminho interno.

### Camada de dados (`db/`)

Um único cliente Drizzle (`db/index.ts`, Neon serverless driver), importado como `import { db } from "@/db"`.
`db/schema/index.ts` é o barrel: cada módulo reexporta suas tabelas ali — é isso que o
`drizzle.config.ts` lê para gerar migrations. Fluxo: declarar tabela no módulo → reexportar no
barrel → `pnpm db:generate` → `pnpm db:migrate`.

### Padrão de autorização (aplicação, não banco)

Não há RLS — Neon não fornece. Toda `query`/`action` que toca dado clínico **revalida `role` +
posse do recurso na aplicação** (nunca confia em role/IDs vindos do cliente; deriva da sessão
Auth.js). Regra central: profissional tem acesso total; cliente só vê o que foi liberado e nunca
anotações internas. Detalhe completo em `docs/context/06-lgpd-seguranca.md`.

### Rotas planejadas (route groups)

```
app/(marketing)/   site público
app/(auth)/entrar  login
app/painel/        área da PROFISSIONAL — layout exige role profissional/recepcao
app/portal/        área do CLIENTE — layout exige role cliente
app/api/auth/[...] handlers do Auth.js
```

### Context bank (`docs/context/`)

Fonte de verdade de domínio/arquitetura/roadmap/LGPD/design — carregar só o doc relevante à
tarefa, nunca o bank inteiro. Índice em `docs/context/README.md`. `docs/context/brief.md` é o
brief original do cliente (referência bruta).
