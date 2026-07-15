# Domínio — entidades e glossário

Modelo conceitual do MVP. Nomes de tabela/coluna em `snake_case`; entidades em `singular`.
As tabelas Drizzle são declaradas por módulo (ver `03-convencoes.md`).

## Entidades principais

- **Usuario** — conta de acesso (Auth.js). Tem `role` (`profissional` | `cliente` | `recepcao`).
  Um usuário-cliente vincula-se a **um** `Cliente`.
- **Cliente** — pessoa atendida. Dados pessoais reutilizáveis (nome, nascimento, telefone,
  e-mail, endereço, contato de emergência, profissão), mais objetivo do tratamento,
  alergias, medicamentos, condições de saúde, cirurgias, contraindicações e consentimentos.
- **Servico** — oferta clínica (ver catálogo em `00-produto.md`/`brief.md`). Grupos:
  massoterapia/terapias, estética corporal, estética facial, saúde integrativa, pré/pós-operatório.
  Campos: descrição, indicação, contraindicações, duração, periodicidade, valor, preparo, cuidados.
- **Pacote** — conjunto de sessões contratadas de um serviço para um cliente: quantidade,
  realizadas, restantes, contratação, validade, valor, forma/situação de pagamento, faltas.
- **Agendamento** — atendimento marcado: cliente, serviço, profissional, data/hora, duração,
  vínculo com pacote, status (marcado, realizado, falta, cancelado), observações. `checkinEm`
  registra a confirmação de presença (chegada na clínica, via QR Code) — independente do status
  "realizado", que só a profissional marca ao concluir o atendimento. `lembreteDiaAnteriorEm`/
  `lembreteHorasAntesEm` (Fase 2) marcam quando cada lembrete baseado em tempo foi disparado pelo
  scheduler — ver `04-roadmap.md`.
- **Ficha / Anamnese** — formulário estruturado por serviço, vinculado ao prontuário do cliente.
  Dinâmica (campos inteligentes). Tem versionamento e status. Detalhe em `07-fichas.md`.
- **Sessao** — registro de um atendimento realizado: serviço, região, equipamentos, parâmetros,
  produtos, duração, relato do cliente, avaliação profissional, escala de dor antes/depois,
  reações, orientações, fotos, medidas, próxima sessão, presença.
- **Medida** — registro corporal por sessão: data, região, lado (D/E), valor inicial, atual,
  diferença, sessão, profissional. Base dos gráficos/tabelas de evolução.
- **Foto** — imagem clínica padronizada (mesma posição/enquadramento/iluminação/distância),
  data, região, para comparação antes/depois. **Dado sensível** (ver `06-lgpd-seguranca.md`).
- **Documento** (`modules/documentos`, Fase 2) — contratos, termos e orientações emitidos pela
  profissional para um cliente: tipo, título, conteúdo, status (emitido/assinado). Assinatura
  eletrônica simples (traço desenhado num `<canvas>`) + evidências capturadas no servidor: IP,
  user-agent e hash SHA-256 do conteúdo assinado (`assinaturaImagemDataUrl`, `assinaturaIp`,
  `assinaturaUserAgent`, `conteudoHash`) — nunca confiadas do cliente além do traço em si. Mesmo
  princípio de separação de consentimento já usado em `Ficha` — **cada consentimento é separado**
  (atendimento ≠ uso de imagem). Acesso restrito a `profissional` (não liberado para `recepcao`).
- **DorRegistro** — escala 0–10, tipo, frequência, localização (mapa corporal), evolução por sessão.
- **EventoAuditoria** — quem criou/alterou o quê e quando (histórico de alterações).
- **LancamentoFinanceiro** — receita ou despesa da clínica: categoria, valor, data, forma e
  situação de pagamento (pendente/pago/cancelado), opcionalmente vinculado a `Cliente`/`Pacote`.
  Acesso restrito a `profissional` (ver `04-roadmap.md` Fase 2). Distinto do valor/situação de
  pagamento já registrados em `Pacote` — este é o livro-caixa completo da clínica.
- **Produto** (`modules/estoque`, Fase 2) — catálogo de insumos (nome, unidade, estoque mínimo
  opcional). Não é a mesma coisa que `Servico`/`Pacote` (o que a clínica **vende**) — é o que ela
  **consome** internamente. "Campo de operações internas" do brief — invisível ao cliente, restrito
  a `profissional`.
- **Lote** — cada remessa recebida de um `Produto`: quantidade inicial, validade, fornecedor,
  custo, nº do lote do fornecedor. É a própria "entrada" no estoque (não existe um evento de
  entrada separado).
- **MovimentacaoEstoque** — só registra **saídas** de um `Lote` (quantidade consumida + motivo
  livre). Disponível de um lote/produto é sempre calculado (inicial − saídas), nunca um campo
  mutável — mesmo princípio de "computado, não guardado" de `Pacote`/`LancamentoFinanceiro`.

## Relações-chave

`Cliente 1—N Pacote`, `Cliente 1—N Agendamento`, `Cliente 1—N Ficha`, `Cliente 1—N Sessao`,
`Cliente 1—N Documento`.
`Pacote 1—N Sessao` (consome sessões). `Sessao 1—N Medida`, `Sessao 1—N Foto`, `Sessao 1—N DorRegistro`.
`Servico` referenciado por `Pacote`, `Agendamento`, `Ficha`, `Sessao`.
`Produto 1—N Lote 1—N MovimentacaoEstoque` — desacoplado do resto do domínio clínico por ora.

## Glossário

- **Anamnese** — ficha de avaliação inicial com histórico de saúde do cliente.
- **Campo inteligente** — campo que só aparece conforme respostas anteriores (condicional).
- **Antes/depois** — comparação padronizada de fotos ao longo do tratamento.
- **Protocolo** — conjunto de procedimentos/parâmetros aplicados numa sessão.
- **Plano de tratamento** — sequência planejada de sessões com evolução registrada.
