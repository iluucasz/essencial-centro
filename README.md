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

`pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint` ·
`pnpm db:generate` · `pnpm db:migrate` · `pnpm db:push` · `pnpm db:studio`
