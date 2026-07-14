# components/

UI **compartilhada** entre módulos (design system). UI específica de uma feature
mora em `modules/<nome>/components/`.

- `ui/` — primitivos do design system (Button, Card, Input, Field, Dialog…),
  estilizados com os tokens da marca (`app/globals.css`). Padrão de composição:
  `class-variance-authority` + `cn()` de `lib/utils`.

Direção visual e tokens: `docs/context/05-design-system.md`.
