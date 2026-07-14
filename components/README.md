# components/

UI **compartilhada** entre módulos (design system). UI específica de uma feature
mora em `modules/<nome>/components/`.

- `ui/` — wrappers compartilhados do design system quando precisarmos padronizar TailGrids,
  encapsular HeroUI ou reaproveitar variações entre módulos. Estilizar sempre com tokens da marca
  (`app/globals.css`); wrappers próprios podem usar `class-variance-authority` + `cn()` de
  `lib/utils`.

Direção visual e tokens: `docs/context/05-design-system.md`.
