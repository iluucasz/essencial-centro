# Arquitetura

## Stack

- **Next.js 16 (App Router)** + **React 19** + **TypeScript** (strict).
  ⚠️ Esta versão do Next difere do conhecido — consultar `node_modules/next/dist/docs/` antes de codar.
- **Tailwind CSS v4** (config via `@theme` em `app/globals.css`).
- **Neon** (Postgres serverless) + **Drizzle ORM** + **drizzle-zod**.
- **Auth.js v5** (`next-auth@5 beta`) + `@auth/drizzle-adapter`.
- **Formulários**: `react-hook-form` + `zod` (`@hookform/resolvers`).
- **UI**: TailGrids gratuitos como base de blocos, HeroUI v3 (`@heroui/react`) como fallback de
  componentes acessíveis, wrappers próprios em `components/ui/` quando fizer sentido; ícones
  `lucide-react`.
- **Datas**: `date-fns`.
- Package manager: **pnpm**.

## Estrutura de pastas (alias `@/*` → raiz)

```
app/          # roteamento App Router (thin); ver "Rotas" abaixo
components/   # design system compartilhado (ui/)
modules/      # features de domínio (unidade de escala) — ver 03-convencoes.md
db/           # cliente Drizzle + schema (barrel) + migrations
lib/          # utilitários transversais (cn, rbac, datas, pdf…)
config/       # constantes (site.ts, brand.ts)
docs/context/ # este context bank
```

## Rotas (planejadas)

Route groups isolam as três áreas; a área restrita valida sessão no layout:

```
app/
  (marketing)/        → site público  (/, /servicos, /contato)
  (auth)/entrar       → login
  painel/             → área da PROFISSIONAL  (/painel, /painel/clientes/[id], …)
  portal/             → área do CLIENTE       (/portal, /portal/tratamento, …)
  api/auth/[...]      → handlers do Auth.js
```

Regra: `painel/*` exige role `profissional` (ou `recepcao` p/ subrotas liberadas);
`portal/*` exige role `cliente`. Autorização checada no `layout.tsx` do grupo + nas actions.

## Padrões de dados

- Leitura: **Server Components** chamam `queries.ts` do módulo (server-only).
- Mutação: **Server Actions** (`"use server"`) em `actions.ts`, sempre validando entrada com Zod
  e **reautorizando** o papel do usuário (nunca confiar no cliente).
- Um único cliente Drizzle: `import { db } from "@/db"`.

## Decisões (ADR-lite)

- **Neon + Drizzle + Auth.js** (não Supabase): portabilidade e controle; SQL puro via Drizzle.
  Custo: sem Storage/RLS embutidos → tratados na aplicação (ver abaixo e `06-lgpd-seguranca.md`).
- **Fotos clínicas**: **Vercel Blob** (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN`), implementado em
  `modules/fotos`. Upload via Server Action com `access: "private"` (blob **não** tem URL pública).
  Só o `pathname` fica salvo no Postgres — nunca a URL do Blob. Leitura via proxy autenticado
  (`app/api/fotos/[id]/imagem`, Route Handler) que chama `get(pathname, { access: "private" })` no
  servidor e reautoriza `role` + posse **a cada request** — mais forte que uma URL assinada de
  prazo fixo, e evita expor o token do Blob ou uma URL "quase pública" no HTML. `@vercel/blob@2.6.1`
  também oferece `issueSignedToken`/`presignUrl` (delegação, presigned URLs) para servir arquivos
  grandes sem passar pelo Next.js — não usado ainda; considerar se performance de imagem exigir.
  Limite de 4MB por foto no MVP (body de Server Action na Vercel: 4.5MB).
- **Autorização**: RBAC na aplicação (checagem de `role` + posse do recurso) em toda query/action
  de dados sensíveis — não há RLS de banco. Centralizar helpers em `lib/`.
- **Auth.js**: módulo `modules/auth` usa Credentials Provider com senha `scrypt`, sessão `jwt` e
  `role`/`clienteId` no token de sessão. Tabelas públicas: `usuario`, `conta`, `sessao_auth`,
  `token_verificacao`, `autenticador`. Se o banco não tiver usuários, `/entrar` libera apenas a
  criação do primeiro acesso profissional; depois disso, criação de usuários exige `profissional`.
- **Sem `src/`**: código na raiz, casando com o alias `@/*` → `./*` já configurado.

## Deploy

### Conteúdo editorial do site

`modules/site-publico` gerencia destaques (imagem/vídeo), depoimentos e profissionais em
`/painel/site`, restrito a `profissional`; `reader` somente consulta. A tabela `conteudo_site`
é independente de cadastros e prontuários. Cada salvamento grava uma versão completa com
autoria em `historico_conteudo_site`, no mesmo batch. A home consulta apenas a projeção pública
dos itens publicados e autorizados, ordenados por `ordem` e data, em tempo de requisição.
Depoimentos incluem `nota` opcional no banco (registros antigos não recebem nota automática),
obrigatória entre 1 e 5 no formulário de publicação. A nota integra o histórico editorial.

Upload direto multipart via `@vercel/blob/client` e `/api/site/upload`, com autorização no
servidor antes de emitir o token. Pasta exclusiva `site-publico/`, arquivos públicos, JPG/PNG/WebP
ou MP4/WebM, até 100 MB por arquivo, sem limite fixo de quantidade de itens. Não importa arquivos
clínicos. A tela tem uma aba por seção, com cards; o formulário abre em modal, com rótulos
próprios de cada seção (`secoesConteudo` em `validacao.ts`). Item novo entra no fim da seção e
as setas do card trocam de lugar com o vizinho, renumerando a seção (`moverConteudo`). O atalho
publicar/ocultar do card revalida o item inteiro antes de publicar. Excluir um item, ou trocar a
mídia na edição, apaga do Blob o arquivo de `site-publico/` que ficou sem uso. As fotos fixas em
`public/` nunca são apagadas. Sem conteúdo publicado, nada fictício aparece no site: o carrossel
mostra uma única foto padrão (`destaquePadrao`), e profissionais e depoimentos ficam ocultos.

Ajustes de mídia (`filtro`, `somOriginal`, `musica`, `volumeMusica` em `conteudo_site`) são
aplicados na exibição; o arquivo original nunca é reprocessado. O filtro é CSS (`filtrosMidia`
em `validacao.ts`) e vale para foto e vídeo. A música é um áudio enviado pela mesma rota de upload
(MP3/M4A/AAC/OGG), que o `PlayerSite` toca em loop e em sincronia com o vídeo (play, pausa,
avanço e fim). Todos os vídeos do site usam o `PlayerSite`, com controles próprios: assim não há
menu "Baixar" nem picture-in-picture em nenhum navegador. O arquivo continua público no Blob.

Textos das seções fixas do site ficam em blocos editáveis (`modules/site-publico/blocos.ts`):
cada bloco tem um schema Zod e um padrão, que é o texto original do site. A tabela `bloco_site`
(chave → jsonb) guarda só o que foi editado, com autoria em `historico_bloco_site`.
`obterBlocosSite()` é pública e mescla o salvo com o padrão; registro inválido é ignorado, então
a home nunca fica sem texto. "Restaurar texto original" apaga o registro. Os componentes de
marketing recebem o bloco por prop, com o padrão como valor default, e a home passa os blocos
salvos. Blocos atuais, na ordem da página: `inicio`, `faixa`, `catalogo` (categorias com ícone
por nome em `icones.ts`, tratamentos e artes), `jornada`, `sobre`, `profissionais` e `depoimentos`
(só o cabeçalho; os cards vêm de `conteudo_site`), `login`, `duvidas`, `contato` e `rodape`.
O telefone do bloco `contato` (via `numeroWhatsapp`) é o destino de todos os botões de WhatsApp
do site, e endereço, telefone e Instagram também alimentam o rodapé. As categorias do catálogo também alimentam o select do contato e o rodapé. Para tornar outra
seção editável: criar schema + padrão em `blocos.ts`, registrar em `blocosSite`, receber o bloco
por prop no componente e criar o editor em `editores-blocos.tsx` com uma aba no `GerenciadorSite`.

Alvo natural Vercel (Next). Segredos via env do provedor. `DATABASE_URL`, `AUTH_SECRET`,
`BLOB_READ_WRITE_TOKEN` obrigatórios.

## IA

`DEEPSEEK_API_KEY` está provisionada no ambiente e usada pelo assistente flutuante do painel
(`modules/assistente`, ver `04-roadmap.md`) e pelas análises clínicas por IA (`modules/analises`).
Para qualquer feature de IA nova, avaliar antes: (1) dado de saúde é enviado a um LLM de terceiro → checar `06-lgpd-seguranca.md`
(consentimento específico, minimização de dado enviado); (2) qualquer alerta/sugestão da IA é
**apoio**, nunca decisão clínica automática — mesma regra já aplicada a medicamentos (`04-roadmap.md`).
