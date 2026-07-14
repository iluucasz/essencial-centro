# Arquitetura

## Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript** (strict).
  ⚠️ Esta versão do Next difere do conhecido — consultar `node_modules/next/dist/docs/` antes de codar.
- **Tailwind CSS v4** (config via `@theme` em `app/globals.css`).
- **Neon** (Postgres serverless) + **Drizzle ORM** + **drizzle-zod**.
- **Auth.js v5** (`next-auth@5 beta`) + `@auth/drizzle-adapter`.
- **Formulários**: `react-hook-form` + `zod` (`@hookform/resolvers`).
- **UI**: TailGrids gratuitos como base de blocos, HeroUI v3 (`@heroui/react`) como fallback de
  componentes acessíveis, wrappers próprios em `components/ui/` quando fizer sentido; ícones
  `lucide-react`.
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
- **Fotos clínicas**: **Vercel Blob** (`BLOB_READ_WRITE_TOKEN` já provisionado — ver `.env.example`).
  Guardar **apenas a URL/chave** no Postgres; upload/leitura sempre via Server Action que checa
  `role` + posse antes de gerar a URL (Blob não tem RLS própria — a checagem é 100% da aplicação).
- **Autorização**: RBAC na aplicação (checagem de `role` + posse do recurso) em toda query/action
  de dados sensíveis — não há RLS de banco. Centralizar helpers em `lib/`.
- **Auth.js**: módulo `modules/auth` usa Credentials Provider com senha `scrypt`, sessão `jwt` e
  `role`/`clienteId` no token de sessão. Tabelas públicas: `usuario`, `conta`, `sessao_auth`,
  `token_verificacao`, `autenticador`. Se o banco não tiver usuários, `/entrar` libera apenas a
  criação do primeiro acesso profissional; depois disso, criação de usuários exige `profissional`.
- **Sem `src/`**: código na raiz, casando com o alias `@/*` → `./*` já configurado.

## Deploy

Alvo natural Vercel (Next). Segredos via env do provedor. `DATABASE_URL`, `AUTH_SECRET`,
`BLOB_READ_WRITE_TOKEN` obrigatórios.

## IA (fase futura — fora do MVP)

`GROQ_API_KEY` está provisionada no ambiente, mas **nenhum módulo do MVP a usa ainda**. Quando uma
feature de IA for definida (ex.: apoio a campos inteligentes de ficha, resumo de evolução),
avaliar antes: (1) dado de saúde é enviado a um LLM de terceiro → checar `06-lgpd-seguranca.md`
(consentimento específico, minimização de dado enviado); (2) qualquer alerta/sugestão da IA é
**apoio**, nunca decisão clínica automática — mesma regra já aplicada a medicamentos (`04-roadmap.md`).
