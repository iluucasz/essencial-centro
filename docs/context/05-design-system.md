# Design System

Marca delicada, acolhedora, ligada a saúde/natureza/autocuidado — mas o **sistema** deve ser mais
limpo que as artes publicitárias (menos ornamentos, foco no uso).

## Estratégia de componentes

- **Blocos de tela/layout**: usar TailGrids gratuitos como referência principal, copiando e adaptando
  o código para o projeto. TailGrids não é uma dependência npm obrigatória neste app.
- **Componentes prontos quando faltar no TailGrids**: usar HeroUI v3 (`@heroui/react`), já compatível
  com React 19 e Tailwind v4. O CSS global importa `@heroui/react/styles`.
- **Primitivos próprios**: criar em `components/ui/` apenas quando precisarmos padronizar uma API,
  encapsular HeroUI ou reaproveitar uma variação de TailGrids. `class-variance-authority` + `cn()`
  continuam permitidos para esses wrappers, mas não são a estratégia única.
- Componentes HeroUI devem usar tokens semânticos (`accent`, `surface`, `border`, `danger` etc.)
  mapeados em `app/globals.css`; blocos TailGrids devem usar classes da marca (`bg-brand`,
  `text-roxo`, `bg-creme`, `border-border` etc.).

## Paleta oficial

Fonte única: `config/brand.ts` (TS) ↔ tokens CSS em `app/globals.css` (`@theme`).

| Papel              | Token / classe                      | Hex       | Uso                                                     |
| ------------------ | ----------------------------------- | --------- | ------------------------------------------------------- |
| Verde principal    | `brand` (`bg-brand`) / `accent`     | `#145B48` | ação primária, títulos, navegação, resultados positivos |
| Roxo institucional | `roxo` (`text-roxo`) / `focus`      | `#4B2A82` | títulos, ícones, botões secundários, foco e links       |
| Lilás suave        | `lilas` (`bg-lilas`)                | `#B9A3DB` | fundos de cartões, seleção, gráficos, notificações      |
| Creme rosado       | `creme` / `background` (`bg-creme`) | `#F8F0ED` | fundo das páginas                                       |
| Verde sálvia       | `salvia` (`text-salvia`)            | `#829A82` | ícones secundários, bordas, categorias                  |
| Dourado            | `dourado` / `warning`               | `#C89A3D` | só detalhes/selos — **nunca** texto longo               |
| Perigo funcional   | `perigo` / `danger`                 | `#B42318` | erros e ações destrutivas                               |
| Texto escuro       | `foreground`                        | `#293630` | corpo de texto                                          |
| Superfície         | `surface`                           | `#FFFFFF` | cartões, overlays, campos                               |

## Direção visual

- Fundo creme muito claro; cartões brancos; títulos em verde ou roxo.
- Ícones lineares (`lucide-react`); cantos arredondados (`--radius`); sombras discretas.
- Folhagens/ornamentos só em telas institucionais ou vazias. Dourado apenas em detalhes.
- Fotos grandes na comparação de resultados; gráficos simples; botões com texto direto.

## Componentes-âncora

- **Botão primário**: `brand`/HeroUI `accent`, texto branco, cantos arredondados (ex.: "Salvar avaliação").
- **Botão secundário**: fundo `lilas` claro ou HeroUI `secondary`, texto `roxo` (ex.: "Comparar resultados").
- **Campos e overlays**: preferir HeroUI quando houver interação, validação visual ou acessibilidade
  complexa; adaptar labels e textos para pt-BR.
- **Blocos de dashboard/formulário**: partir dos gratuitos do TailGrids, removendo ornamento excessivo
  e trocando todas as cores por tokens da marca.

## Tipografia

Geist (sans/mono) já configurada em `app/layout.tsx`. Tipografia oficial da marca a definir;
manter Geist como padrão limpo até lá.

## Ícone do app

Símbolo reconhecível (flor de lótus + gota dourada) sobre fundo verde ou roxo — não a logo completa.
