# Design System

Marca delicada, acolhedora, ligada a saúde/natureza/autocuidado — mas o **sistema** deve ser mais
limpo que as artes publicitárias (menos ornamentos, foco no uso).

## Paleta oficial

Fonte única: `config/brand.ts` (TS) ↔ tokens CSS em `app/globals.css` (`@theme`).

| Papel              | Token / classe         | Hex       | Uso                                                     |
| ------------------ | ---------------------- | --------- | ------------------------------------------------------- |
| Verde principal    | `brand` (`bg-brand`)   | `#145B48` | ação primária, títulos, navegação, resultados positivos |
| Roxo institucional | `roxo`                 | `#4B2A82` | títulos, ícones, botões secundários, destaques          |
| Lilás suave        | `lilas`                | `#B9A3DB` | fundos de cartões, seleção, gráficos, notificações      |
| Creme rosado       | `creme` / `background` | `#F8F0ED` | fundo das páginas                                       |
| Verde sálvia       | `salvia`               | `#829A82` | ícones secundários, bordas, categorias                  |
| Dourado            | `dourado`              | `#C89A3D` | só detalhes/selos — **nunca** texto longo               |
| Texto escuro       | `foreground`           | `#293630` | corpo de texto                                          |
| Superfície         | `surface`              | `#FFFFFF` | cartões                                                 |

## Direção visual

- Fundo creme muito claro; cartões brancos; títulos em verde ou roxo.
- Ícones lineares (`lucide-react`); cantos arredondados (`--radius`); sombras discretas.
- Folhagens/ornamentos só em telas institucionais ou vazias. Dourado apenas em detalhes.
- Fotos grandes na comparação de resultados; gráficos simples; botões com texto direto.

## Componentes-âncora

- **Botão primário**: fundo `brand`, texto branco, cantos arredondados (ex.: "Salvar avaliação").
- **Botão secundário**: fundo `lilas` claro, texto `roxo` (ex.: "Comparar resultados").
- Construir em `components/ui/` com `class-variance-authority` + `cn()`.

## Tipografia

Geist (sans/mono) já configurada em `app/layout.tsx`. Tipografia oficial da marca a definir;
manter Geist como padrão limpo até lá.

## Ícone do app

Símbolo reconhecível (flor de lótus + gota dourada) sobre fundo verde ou roxo — não a logo completa.
