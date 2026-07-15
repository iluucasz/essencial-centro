# LGPD & Segurança

O sistema guarda **dados pessoais sensíveis** (saúde, fotografias corporais, biometria futura).
Isso é requisito de arquitetura, não item opcional.

## Princípios

- **Controle de acesso (RBAC)** em toda leitura/escrita de dado clínico: checar `role` **e** posse
  (o cliente só acessa os próprios registros). Não há RLS no banco → a checagem vive na aplicação
  (helpers em `lib/`), aplicada em **toda** query/action. Ver `03-convencoes.md`.
- **Cliente nunca vê anotações internas** nem campos profissionais não liberados (ver `00-produto.md`).
- **Consentimentos separados**: atendimento ≠ uso de imagem ≠ contrato. Cada um registrado,
  datado e versionado individualmente. Uso de imagem é opt-in explícito.
- **Registro de atividades (auditoria)**: quem criou/alterou, quando, e conteúdo anterior.
- **Fotos e arquivos sensíveis**: no Postgres só a chave/URL, nunca exposta no HTML/UI — acesso
  sempre via proxy autenticado (`app/api/fotos/[id]/imagem`) que reautoriza role+posse a cada
  request. **Ver alerta abaixo — o bucket atual não é privado.**
- **Política de privacidade** clara e consentimento para uso de dados no cadastro.

## ⚠️ Pendência conhecida: Vercel Blob está em modo público

O store do Vercel Blob conectado (`BLOB_READ_WRITE_TOKEN`) está configurado como **público**
(`access:"public"` — a API rejeita `access:"private"` nesse store: "Cannot use private access on
a public store"). Decisão registrada em `modules/fotos`: manter público por ora, ajustar depois
(o app nunca expõe a URL do blob na UI — só o `pathname` interno via proxy autenticado — mas
**quem obtiver a URL real do arquivo acessa sem login**, já que o nome tem só um sufixo aleatório
como proteção, não controle de acesso de verdade).

**Antes de subir fotos reais de pacientes em produção**, resolver de um destes jeitos:

1. Reconfigurar o store existente para privado no painel da Vercel (Storage → Blob store → Settings).
2. Criar um novo store dedicado a fotos clínicas, privado desde a criação, e trocar o
   `BLOB_READ_WRITE_TOKEN` usado por `modules/fotos`.

Depois disso, trocar `access:"public"` → `access:"private"` em `modules/fotos/actions.ts` e em
`app/api/fotos/[id]/imagem/route.ts` (única mudança de código necessária).

## Versionamento de fichas

Após assinada, uma ficha **não é sobrescrita**: mudança gera nova versão ou adendo.
Cada ficha guarda: criação, última atualização, quem alterou, conteúdo anterior, assinaturas,
status (`rascunho` | `preenchida` | `revisada` | `assinada`).

## Segredos

`.env.local` (ignorado). `AUTH_SECRET` forte; `DATABASE_URL` só em env. Nada de credencial no repo.
Repositório está público — **não** commitar dados reais de pacientes nem dumps.

## Áreas sensíveis específicas

- **Medicamentos**: área é "Medicamentos informados e alertas de segurança" — apoio à conferência,
  **nunca** decisão clínica automática. Alerta sempre exige validação de profissional habilitado.
- **Biometria**: adiada (Fase 3) por custo/risco; presença via botão/PIN/QR Code no MVP.
