# Convenções de código

## Como adicionar uma feature (receita)

1. Crie `modules/<nome>/`.
2. `schema.ts`: tabela(s) Drizzle + schemas Zod (`drizzle-zod` para derivar de insert/select).
3. Reexporte a tabela em `db/schema/index.ts`; rode `pnpm db:generate && pnpm db:migrate`.
4. `queries.ts`: leituras server-only. `actions.ts`: mutações com `"use server"`.
5. `components/`: UI da feature (usa blocos TailGrids adaptados, HeroUI ou wrappers de
   `@/components/ui`, conforme `05-design-system.md`).
6. Rotas em `app/painel/...` ou `app/portal/...` consomem o módulo. Páginas de `app/painel/*` **não**
   recriam `<main>`/fundo/cabeçalho de página — o shell (`components/layout/painel-shell.tsx`,
   ver `05-design-system.md`) já provê isso; a página começa direto no conteúdo.
7. Toda action/query de dado sensível **revalida role + posse** (ver `06-lgpd-seguranca.md`).
8. Atualize o context bank se mudou domínio/arquitetura/fluxo.

## Nomenclatura

- Arquivos/pastas: `kebab-case`. Componentes React: `PascalCase`. Vars/funções: `camelCase`.
- Tabelas/colunas SQL: `snake_case`, tabela no `singular` (`cliente`, `sessao`).
- Server Actions: verbos (`criarCliente`, `registrarSessao`). Queries: `getCliente`, `listarSessoes`.
- Textos de UI e domínio em **pt-BR**. Código/identificadores em português quando for termo de domínio.

## Formulários

Dois padrões, conforme a complexidade do dado — o **mesmo** schema Zod sempre valida no cliente
(quando houver) e **revalida na action** (nunca confiar só no cliente):

- **Simples (achatado, poucos campos)**: `<form action={formAction}>` nativo + `useActionState`,
  lendo `FormData` na action (ver `modules/clientes`, `modules/servicos`, `modules/agenda`,
  `modules/pacotes`). Sem RHF — menos peso para casos que não precisam de campo condicional.
- **Complexo (dados aninhados e/ou campos inteligentes)**: `react-hook-form` + `zodResolver`,
  chamando a Server Action **diretamente com o objeto tipado** (não `FormData`) no `onSubmit` do
  RHF. Campos inteligentes (condicionais) via `watch()` do RHF. Ver `modules/fichas` — primeiro
  módulo a usar esse padrão — e `07-fichas.md`.

## Server Actions — checklist

- `"use server"` no topo; um arquivo `actions.ts` por módulo.
- 1º: obter sessão (`auth()`); 2º: autorizar role/posse; 3º: validar input com Zod; 4º: mutar; 5º:
  registrar auditoria quando aplicável; 6º: `revalidatePath`/`revalidateTag`.
- Nunca receber `role`/IDs de dono do formulário — derivar da sessão.

## UI / estilo

- Só tokens da marca/semânticos (classes `bg-brand`, `text-roxo`, `bg-creme`, `border-border`,
  HeroUI `accent`/`surface`/`danger`…). Nada de hex solto.
- TailGrids gratuito é a referência de blocos; HeroUI cobre componentes acessíveis quando o TailGrids
  não tiver algo adequado. Wrappers próprios podem usar `class-variance-authority` + `cn()`.
- Telas de `/painel` e `/portal` seguem o blueprint de layout (sidebar/header, cards de KPI, tabela,
  perfil) documentado em `05-design-system.md` → "Referência de layout — DashSpace (TailGrids)".
- Acessibilidade: labels associadas, foco visível, contraste conforme `05-design-system.md`.

## Testes

- Ferramenta: **Vitest** (+ Testing Library p/ componentes; `jsdom`). Arquivos `*.test.ts(x)`
  ao lado do código.
- **Toda feature entra com teste** cobrindo a regra de negócio principal e a **autorização**
  (cliente não acessa recurso alheio; campos internos não vazam).
- Rodar: `pnpm test` (uma vez) ou `pnpm test:watch`.

## Qualidade — portões automáticos

- `pnpm check` = `typecheck` + `lint` + `format:check` + `test`. Rodar antes de finalizar tarefa.
- **Pre-commit (Husky + lint-staged)**: formata/lint dos arquivos staged + typecheck; **aborta o
  commit** se falhar. Não use `--no-verify`.
- Formatação é do **Prettier** (inclui ordenação de classes Tailwind); ESLint não formata.
- Não commitar segredos; `.env.local` é ignorado. Migrations geradas não são editadas à mão.
