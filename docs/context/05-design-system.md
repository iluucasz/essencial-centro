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
| Creme rosado       | `creme` / `background` (`bg-creme`) | `#F8F0ED` | fundo do site público (marketing/login) — ver nota      |
| Verde sálvia       | `salvia` (`text-salvia`)            | `#829A82` | ícones secundários, bordas, categorias                  |
| Dourado            | `dourado` / `warning`               | `#C89A3D` | só detalhes/selos — **nunca** texto longo               |
| Perigo funcional   | `perigo` / `danger`                 | `#B42318` | erros e ações destrutivas                               |
| Texto escuro       | `foreground`                        | `#293630` | corpo de texto                                          |
| Superfície         | `surface`                           | `#FFFFFF` | cartões, overlays, campos                               |

**Fundo e borda das áreas internas (painel/portal):** o creme rosado quente acima é só do site
público — dentro das áreas logadas, a classe `.area-interna` (em `app/globals.css`, já aplicada no
`painel-shell.tsx` e no `<main>` de cada página do portal) sobrescreve `--background` para
`#F7F6FA` (tom frio quase branco com leve toque de lilás — harmoniza verde e roxo ao mesmo tempo,
diferente do creme quente) e `--border` para `#ECECF3` (quase invisível — telas densas de
dashboard pedem contraste mais fraco que o `#E7DCD6` do site público). Como os componentes
continuam usando as classes `bg-creme`/`hover:bg-creme`/`border-border` normalmente, essa troca é
automática por cascata de CSS — não precisa (nem deve) trocar a classe componente por componente.

**Site público e login importados do protótipo `login_site`:** a home `/` e `/entrar` usam os
componentes copiados para `components/marketing/` e os tokens adicionais `cream`, `ink`, `forest`,
`sage`, `clay` e `line` declarados em `app/globals.css`. Esses tokens são deliberadamente restritos
ao namespace de marketing/login para preservar o visual do protótipo; as áreas internas continuam
usando `brand`, `roxo`, `creme`, `surface`, `border` e demais tokens oficiais.

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

## Referência de layout — DashSpace (TailGrids)

Blueprint estrutural para as telas internas (`/painel`, e o shell também vale para `/portal`):
clone estático fiel do template **DashSpace** da TailGrids. Guardado localmente (não versionado,
material de terceiro — ver `.gitignore`) em `docs/design-reference/dashspace-tailgrids/`. Se a
pasta não existir na sua máquina, tudo que importa dela já está extraído abaixo — este doc é
autossuficiente.

**O que copiar dele:** a estrutura de layout, a escala de espaçamento/raio/sombra, e os padrões de
tela (shell, tabela, cards de KPI, perfil).
**O que NÃO copiar:** a paleta dele (azul `#3758F9`) — usamos sempre os tokens da marca
(verde/roxo/lilás/creme, e o `.area-interna` frio nas áreas logadas). Ele também **não inclui
telas de login/autenticação** prontas (só um item de menu) — login segue um layout próprio
(cartão centralizado, sem sidebar), não o shell abaixo.

### Shell do painel (sidebar + header)

Implementado em `components/layout/painel-shell.tsx`, usado por `app/painel/layout.tsx`. Toda
página nova em `app/painel/*` já herda o shell — não recrie `<main>`/cabeçalho de página inteira,
apenas o conteúdo (a página começa direto no `<div className="grid gap-...">`, **sem** `mx-auto`/
`max-w-*` próprio). O `<main>` do shell ocupa toda a largura útil e usa o mesmo padding lateral do
header (`px-4` / `md:px-6`), para o conteúdo alinhar entre o chip de área à esquerda e o perfil do
usuário à direita. Exceção deliberada: páginas de confirmação/ação única e estreitas por
natureza (ex.: `app/painel/checkin/[id]/page.tsx`) podem manter `mx-auto max-w-md` própria.
Estrutura do shell:

- **Sidebar fixa, 288px (`w-72`) / recolhida, 80px (`w-20`)**: logo no topo (64px de altura) com
  botão de recolher/expandir, seções de navegação com rótulo (`Menu`, depois grupos por domínio
  conforme os módulos crescem), item ativo com `bg-lilas/20 text-roxo`, hover `bg-creme`. Em
  mobile, desliza (`-translate-x-full` quando fechada) com overlay e botão hambúrguer.
- **Header fixo, 64px (`h-16`)**: sem sombra e sem blur, apenas borda inferior sutil; à esquerda fica
  o chip de área (`Área profissional`/`Recepção`) e à direita avatar + nome + chevron do usuário
  (`MenuUsuario`).
- **Conteúdo**: `padding` de `1.5rem` (`p-6`), `gap` entre cards de `1.5rem`.

### Escala a adotar (idêntica à do clone, já é o que usamos)

Raios: `sm 0.25rem · md 0.375rem · lg 0.5rem · xl 0.75rem · 2xl 1rem`. Cards em `rounded-2xl`,
botões/itens de nav em `rounded-lg`, avatar em `rounded-full`. Em áreas internas densas, cards
preferem superfície branca + borda sutil, sem sombra; dropdown/overlay: `shadow-md`. Transição padrão:
`0.15s cubic-bezier(0.4,0,0.2,1)`.

### Padrões de tela reaproveitáveis

- **Home do painel (KPIs)**: `components/ui/card-kpi.tsx` — visual "fraquinho" tipo Neoxa:
  **borda sutil e sem sombra**, apoiado no contraste entre `bg-surface` e o fundo interno; **sem
  badge colorido de ícone** (o ícone é pequeno e discreto, tingido por `cor`: `muted` por padrão,
  `roxo`/`brand`/`dourado`/`perigo` só quando o estado pedir destaque, ex.: alerta) + número grande
  - tendência opcional (`tendencia`: seta verde/vermelha + `%` + rótulo, ex.: "vs mês anterior").
    **A tendência só aparece quando há base de comparação real calculada**
    (`lib/utils.ts` → `calcularVariacaoPercentual`, retorna `null` sem base) — nunca inventar
    percentual, ao contrário dos KPIs de demonstração do clone/Neoxa (ex.: "+10% vs last 30 days"
    fixo). O card reserva a altura da tendência mesmo quando ela não existe (`min-h-36` + slot
    vazio), para todos os KPIs da linha manterem o mesmo tamanho. A grade de cards usa
    `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` (fluida, proporcional à largura da tela) em vez
    de breakpoints fixos — evita o "4 em cima, 1 sobrando embaixo" quando o número de cards varia por
    papel (ex.: painel tem 4 cards pra recepção, 5 pra profissional).
    Gráfico de tendência (`modules/agenda/components/grafico-atendimentos.tsx`, Recharts
    `AreaChart`) usa as cores via `var(--color-brand)`/`var(--color-border)`/`var(--color-muted)` do
    tema, nunca hex solto — mesma regra de tokens dos demais componentes. Referência visual adicional
    (inspiração de card/gráfico/densidade, não paleta): template **Neoxa** da TailGrids — pago, sem
    clone local; usar só como direção.
- **Tabela/listagem** (já usado em `clientes` e `servicos`, mas sem paginação ainda): linha com
  avatar/ícone + nome + meta secundária à esquerda, dado de destaque à direita, badges de status
  coloridos (`success`/`warning`/`danger`/`default`) para estado (ex.: sessão realizada/pendente/falta).
  Nas páginas de painel, o título e as ações da seção ficam soltos (`section.grid gap-4`), seguindo
  agenda/financeiro; a borda fica na lista ou nos cards internos, sem um container envolvendo título,
  ação e lista. Quando a listagem for operacional (ex.: clientes), preferir um bloco de tabela com
  toolbar interna: título/contagem à esquerda, busca/filtros automáticos à direita, cabeçalho de
  colunas, coluna de ações à direita. A ação principal de criação pode ficar no cabeçalho da página
  quando a toolbar da tabela já tiver muitos filtros. Em tabelas de CRUD, a linha inteira deve abrir
  o registro, e ações secundárias/destrutivas ficam em menu de três pontos com confirmação quando
  houver risco de perda de dados. **Sem checkbox de seleção** enquanto não houver ação em massa real
  (excluir/exportar) implementada — checkbox que não faz nada é código morto. Adicionar paginação
  seguindo o clone quando as listas crescerem.
- **Perfil**: capa + avatar sobreposto + nome/cargo + ações (`Editar`, `Copiar link`) + bio — útil
  como base do perfil do cliente no portal (`/portal`) e do perfil da profissional.
- **Formulário**: já seguimos o padrão (label + campo + erro inline) nos módulos `clientes`/`servicos`;
  manter.
- **Microinterações**: usar `motion` apenas para transições leves e funcionais. Modais usam
  `components/ui/modal-formulario.tsx` com entrada suave do diálogo e stagger curto entre cabeçalho
  e corpo, respeitando `prefers-reduced-motion`. Evitar animações decorativas longas em fluxos
  operacionais.

## Tipografia

**Plus Jakarta Sans** (via `next/font/google`, `app/layout.tsx`) é a tipografia principal da marca
para texto (`--font-sans`). **Inter** é a tipografia secundária para títulos (`--font-heading`, já
aplicada globalmente em `h1`–`h6`). Geist Mono continua para contexto monoespaçado (`--font-mono`).

## Ícone do app

Símbolo reconhecível (flor de lótus + gota dourada) sobre fundo verde ou roxo — não a logo completa.
