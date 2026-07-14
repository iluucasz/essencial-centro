# Arquitetura

## Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript** (strict).
  ⚠️ Esta versão do Next difere do conhecido — consultar `node_modules/next/dist/docs/` antes de codar.
- **Tailwind CSS v4** (config via `@theme` em `app/globals.css`).
- **Neon** (Postgres serverless) + **Drizzle ORM** + **drizzle-zod**.
- **Auth.js v5** (`next-auth@5 beta`) + `@auth/drizzle-adapter`.
- **Formulários**: `react-hook-form` + `zod` (`@hookform/resolvers`).
- **UI**: primitivos próprios com `class-variance-authority` + `cn()` (`lib/utils`), ícones `lucide-react`.
- **Datas**: `date-fns`.
- Package manager: **pnpm**.

## Estrutura de pastas (alias `@/*` → raiz)

```
app/          # roteamento App Router (thin); ver "Rotas" abaixo
components/   # design system compartilhado (ui/)
modules/      # features de domínio (unidade de escala) — ver 03-convencoes.md
db/           # cliente Drizzle + schema (barrel) + migrations
lib/          # utilitários transversais (cn, rbac, datas, pdf…)
config/       # constantes (site.ts, brand.ts)
docs/context/ # este context bank
```

## Rotas (planejadas)

Route groups isolam as três áreas; a área restrita valida sessão no layout:

```
app/
  (marketing)/        → site público  (/, /servicos, /contato)
  (auth)/entrar       → login
  painel/             → área da PROFISSIONAL  (/painel, /painel/clientes/[id], …)
  portal/             → área do CLIENTE       (/portal, /portal/tratamento, …)
  api/auth/[...]      → handlers do Auth.js
```

Regra: `painel/*` exige role `profissional` (ou `recepcao` p/ subrotas liberadas);
`portal/*` exige role `cliente`. Autorização checada no `layout.tsx` do grupo + nas actions.

## Padrões de dados

- Leitura: **Server Components** chamam `queries.ts` do módulo (server-only).
- Mutação: **Server Actions** (`"use server"`) em `actions.ts`, sempre validando entrada com Zod
  e **reautorizando** o papel do usuário (nunca confiar no cliente).
- Um único cliente Drizzle: `import { db } from "@/db"`.

## Decisões (ADR-lite)

- **Neon + Drizzle + Auth.js** (não Supabase): portabilidade e controle; SQL puro via Drizzle.
  Custo: sem Storage/RLS embutidos → tratados na aplicação (ver abaixo e `06-lgpd-seguranca.md`).
- **Fotos clínicas**: como Neon não tem storage, definir provedor de blobs na fase de fotos
  (candidatos: Vercel Blob, Cloudflare R2, S3). Guardar **apenas a URL/chave** no Postgres;
  arquivo em bucket privado com acesso assinado. Placeholder de env em `.env.example`.
- **Autorização**: RBAC na aplicação (checagem de `role` + posse do recurso) em toda query/action
  de dados sensíveis — não há RLS de banco. Centralizar helpers em `lib/`.
- **Sem `src/`**: código na raiz, casando com o alias `@/*` → `./*` já configurado.

## Deploy

Alvo natural Vercel (Next). Segredos via env do provedor. `DATABASE_URL`, `AUTH_SECRET` obrigatórios.
