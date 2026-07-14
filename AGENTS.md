<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Essencial Centro — guia do agente

Plataforma de gestão e acompanhamento clínico (estética, massoterapia, integrativa, pré/pós-op),
com área da **profissional** e área do **cliente**. Lida com **dados de saúde sensíveis (LGPD)**.

## Context bank — carregue só o que a tarefa pede
Índice e regra de uso em [`docs/context/README.md`](docs/context/README.md). **Não leia o bank inteiro.**
Atalhos: produto `00` · domínio `01` · arquitetura `02` · convenções `03` · roadmap `04` ·
design `05` · LGPD/segurança `06` · fichas `07`. Ao mudar domínio/arquitetura/fluxo, **atualize o doc**.

## Regras-guarda (sempre)
- **LGPD**: toda query/action de dado clínico revalida `role` + posse; o cliente nunca vê anotação
  interna nem campo não liberado. Detalhe em `docs/context/06-lgpd-seguranca.md`.
- **UI**: só tokens da marca (`bg-brand`, `text-roxo`, `bg-creme`…), nunca hex solto. Ver `05`.
- **Textos e domínio em pt-BR.** Stack: Next 16 (App Router) + Drizzle/Neon + Auth.js v5 + RHF/Zod + Tailwind v4 (pnpm).
- **Adicionar feature** = um módulo em `modules/`. Receita em `docs/context/03-convencoes.md`.
- Antes de commitar: `pnpm typecheck` e `pnpm lint` limpos; nunca commitar segredos ou dados reais.
