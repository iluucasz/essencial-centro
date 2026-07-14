# Convenções de código

## Como adicionar uma feature (receita)
1. Crie `modules/<nome>/`.
2. `schema.ts`: tabela(s) Drizzle + schemas Zod (`drizzle-zod` para derivar de insert/select).
3. Reexporte a tabela em `db/schema/index.ts`; rode `pnpm db:generate && pnpm db:migrate`.
4. `queries.ts`: leituras server-only. `actions.ts`: mutações com `"use server"`.
5. `components/`: UI da feature (usa primitivos de `@/components/ui`).
6. Rotas em `app/painel/...` ou `app/portal/...` consomem o módulo.
7. Toda action/query de dado sensível **revalida role + posse** (ver `06-lgpd-seguranca.md`).
8. Atualize o context bank se mudou domínio/arquitetura/fluxo.

## Nomenclatura
- Arquivos/pastas: `kebab-case`. Componentes React: `PascalCase`. Vars/funções: `camelCase`.
- Tabelas/colunas SQL: `snake_case`, tabela no `singular` (`cliente`, `sessao`).
- Server Actions: verbos (`criarCliente`, `registrarSessao`). Queries: `getCliente`, `listarSessoes`.
- Textos de UI e domínio em **pt-BR**. Código/identificadores em português quando for termo de domínio.

## Formulários
- `react-hook-form` + `zodResolver`. O **mesmo** schema Zod valida no cliente e re-valida na action.
- Campos inteligentes (condicionais) via `watch()` do RHF — ver `07-fichas.md`.

## Server Actions — checklist
- `"use server"` no topo; um arquivo `actions.ts` por módulo.
- 1º: obter sessão (`auth()`); 2º: autorizar role/posse; 3º: validar input com Zod; 4º: mutar; 5º:
  registrar auditoria quando aplicável; 6º: `revalidatePath`/`revalidateTag`.
- Nunca receber `role`/IDs de dono do formulário — derivar da sessão.

## UI / estilo
- Só tokens da marca (classes `bg-brand`, `text-roxo`, `bg-creme`…). Nada de hex solto.
- Variantes de componente com `class-variance-authority`; merge de classes com `cn()`.
- Acessibilidade: labels associadas, foco visível, contraste conforme `05-design-system.md`.

## Qualidade
- `pnpm typecheck` e `pnpm lint` limpos antes de commit.
- Não commitar segredos; `.env.local` é ignorado. Migrations geradas não são editadas à mão.
