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
- **Exclusão destrutiva de cliente**: restrita ao papel `profissional`, sempre com confirmação
  explícita na UI. A action do servidor deve apagar/soltar os vínculos clínicos e operacionais
  associados em transação (agenda, sessões, fichas, medidas, fotos, documentos, medicamentos,
  pacotes, biometria e financeiro) antes de remover o cadastro.
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

## Assinatura eletrônica de documentos

`modules/documentos` (Fase 2) coleta, no momento da assinatura, **IP e user-agent do cliente** como
evidência de autenticidade — capturados sempre no servidor (`headers()`, nunca de input do
formulário) e nunca no `criarDocumento` (só existem a partir do momento em que o cliente assina).
É uma nova categoria de dado pessoal coletado; some junto com o traço da assinatura e o hash
SHA-256 do conteúdo assinado (prova de integridade). Visível tanto pro cliente (no próprio
documento, em `/portal/documentos/[id]`) quanto pra profissional (`/painel/clientes/[id]/documentos/[documentoId]`)
— transparência, não coleta oculta.

## Terceiros que processam dado pessoal

- **Brevo** (`modules/notificacoes/email.ts`, Fase 2) — recebe e-mail, nome e o conteúdo da
  mensagem (que pode citar tipo de atendimento/horário) de todo cliente notificado, pra enviar o
  reforço por e-mail das notificações. Nunca recebe dado clínico (fichas, sessões, medidas, fotos,
  medicamentos) — só o que já está no corpo de uma notificação in-app comum. Igual ao Vercel Blob,
  é um processador terceirizado de dado pessoal — considerar no aviso de privacidade quando ele for
  escrito.
- **Evolution API / Zeabur** (`modules/notificacoes/whatsapp.ts`, Fase 2) — instância própria do
  cliente (self-hosted, não é serviço da Meta), mas ainda assim um terceiro que processa dado
  pessoal: recebe telefone e o mesmo conteúdo de notificação enviado por e-mail, pra reforço via
  WhatsApp. Mesma regra do Brevo — nunca recebe dado clínico, só o texto já usado no e-mail/in-app.
  Roda sobre uma lib não-oficial (Baileys) por trás da Evolution API — o risco de ban do número do
  WhatsApp discutido na Fase 2 do roadmap é do cliente, que optou por hospedar essa instância; a
  aplicação em si só fala HTTP com ela.
- **Groq** (`modules/assistente`, Fase 3) — LLM de terceiro usado pelo assistente de IA flutuante
  do painel (botão restrito a `profissional`, nunca visível pra `recepcao`/`cliente`). Recebe só o
  resultado já filtrado/resumido (`modules/assistente/reshape.ts`) da ferramenta acionada pela
  pergunta feita — nunca um dump em lote de uma tabela inteira, e nunca dado de um cliente que não
  o perguntado. Fotografias e o conteúdo do Vercel Blob nunca são enviados (só metadados: contagem
  e data da última foto) — nem a assinatura eletrônica, IP ou user-agent de `modules/documentos`
  (`reshapeDocumento` os descarta antes de montar a resposta da ferramenta). **O sistema nunca
  sugere/calcula medicamento, dosagem ou interação** — só relata o que a profissional já registrou
  manualmente (mesma regra de `modules/medicamentos`, `04-roadmap.md`); o prompt do assistente
  reforça essa recusa explicitamente. Sem consentimento específico adicional coletado nesta fase
  (dado já é visível à própria profissional dentro do painel) — considerar no aviso de privacidade
  quando ele for escrito, junto dos demais processadores terceirizados.

## Segredos

`.env.local` (ignorado). `AUTH_SECRET` forte; `DATABASE_URL` só em env. Nada de credencial no repo.
Repositório está público — **não** commitar dados reais de pacientes nem dumps.

## Áreas sensíveis específicas

- **Medicamentos**: `modules/medicamentos` — área é "Medicamentos informados e alertas de
  segurança" — apoio à conferência, **nunca** decisão clínica automática. O campo `alertaInteracao`
  é sempre preenchido manualmente pela profissional; o sistema nunca sugere ou calcula interações
  entre medicamentos. Alerta sempre exige validação de profissional habilitado — `criarMedicamentoInformado`
  (registro) e `confirmarVerificacaoMedicamento` (conferência) são duas ações deliberadamente
  separadas, nunca uma confirmação automática no ato de informar. Restrito a `profissional`.
- **Biometria**: check-in por impressão digital (Fase 3, `modules/biometria`) — alternativa ao QR
  Code, nunca substitui: o cliente pode ser confirmado por QR Code a qualquer momento, mesmo com
  biometria cadastrada. Só o **template extraído** (binário proprietário do SDK do leitor) é
  persistido — a imagem crua do dedo nunca é gravada em banco, só existe em memória na ponte física
  durante a captura, mesmo padrão de "nunca guardar o bruto" já usado em `modules/documentos`
  (assinatura) e `modules/fotos` (Blob). Identificação 1:N é **restrita aos clientes com
  agendamento `marcado` de hoje** (nunca a base inteira) — a lição principal de um app de referência
  de outra organização (sistema de presença por biometria, estudado antes de desenhar este módulo):
  quanto maior o grupo de candidatos numa busca 1:N, maior o risco composto de falso aceite. Um
  índice único parcial (`biometria_cliente_ativo_unique`, em `cliente_id + dedo` onde
  `ativo = true`) impede acúmulo de cadastros ativos duplicados — bug real do app de referência
  (cadastros chegando a 7 registros ativos simultâneos pro mesmo dedo/pessoa). Toda tentativa de
  identificação é registrada (`tentativa_identificacao_biometrica`) — sucesso, rejeição ou sem
  correspondência — com FAR, qualidade e o template envolvido; essa trilha faltava completamente no
  app de referência, o que inviabilizou lá uma investigação forense real de um possível falso
  positivo. Duas melhorias de segurança em relação a ele: (1) qualidade da captura é **exigida no
  cadastro** (o app de referência capturava mas nunca rejeitava com base nisso, então cadastros
  ruins sempre eram salvos); (2) checagem de **ambiguidade** entre o 1º e 2º colocado do
  `FTRIdentify` (o app de referência só olhava o candidato de índice 0). A ponte física (app desktop
  C#/.NET, fora deste repositório — leitor Futronic é hardware x86/Win32) nunca recebe credencial de
  banco: fala só HTTP com `app/api/biometria/*`, autenticada por um segredo próprio
  (`BIOMETRIA_BRIDGE_SECRET`, mesmo padrão do `CRON_SECRET`). A ponte é tratada como **relatora não
  confiável** — toda tentativa que ela reporta é revalidada no servidor (existência/posse do
  cadastro, FAR/qualidade/ambiguidade contra limiares próprios) antes de gravar
  `agendamento.checkinEm`. Exige consentimento específico (`cliente.consentimentoBiometria`)
  registrado antes de qualquer cadastro. Restrito a `profissional`/`recepcao`, igual ao check-in por
  QR Code.
