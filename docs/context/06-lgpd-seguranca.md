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
- **Fotos e arquivos sensíveis**: bucket privado; no Postgres só a chave/URL; acesso via URL
  assinada de curta duração. Cliente só acessa as próprias imagens.
- **Política de privacidade** clara e consentimento para uso de dados no cadastro.

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
