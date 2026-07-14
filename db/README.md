# db/

Camada de dados (Neon Postgres + Drizzle ORM).

- `index.ts` — cliente Drizzle único (`import { db } from "@/db"`).
- `schema/index.ts` — barrel que reexporta as tabelas de cada módulo.
- `migrations/` — geradas por `pnpm db:generate` (não editar à mão).

Fluxo: declarar tabela no módulo → reexportar em `schema/index.ts` →
`pnpm db:generate` → `pnpm db:migrate`. Config em `drizzle.config.ts`.
