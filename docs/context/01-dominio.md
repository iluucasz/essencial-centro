# Domínio — entidades e glossário

Modelo conceitual do MVP. Nomes de tabela/coluna em `snake_case`; entidades em `singular`.
As tabelas Drizzle são declaradas por módulo (ver `03-convencoes.md`).

## Entidades principais

- **Usuario** — conta de acesso (Auth.js). Tem `role` (`profissional` | `cliente` | `recepcao`).
  Um usuário-cliente vincula-se a **um** `Cliente`.
- **Cliente** — pessoa atendida. Dados pessoais reutilizáveis (nome, nascimento, telefone,
  e-mail, endereço, contato de emergência, profissão), mais objetivo do tratamento,
  alergias, medicamentos, condições de saúde, cirurgias, contraindicações e consentimentos.
- **Servico** — oferta clínica (ver catálogo em `00-produto.md`/`brief.md`). Grupo é texto livre com
  lista de sugestões extensível (`opcaoServico`, ver `modules/servicos/schema.ts`) — padrão inicial:
  massoterapia/terapias, estética corporal, estética facial, saúde integrativa, pré/pós-operatório; a
  profissional pode adicionar outras digitando "Outro" no formulário, e excluir as que ela mesma criou
  (não as padrão). Campos: descrição, indicação, contraindicações, duração, valor (**da sessão
  avulsa**), preparo, cuidados. **Sem periodicidade** (removida). Ao ser criado, redireciona para a
  página do serviço, que oferece cadastrar os pacotes dele.
- **Pacote** (tabela `plano_pacote`, `modules/planos`) — a **faixa de pacote de um serviço** (ex.: 5
  sessões = R$X, 10 = R$Y). Template ligado ao serviço, **sem cliente**. Serviço só-avulso = nenhum
  pacote. Campos: serviço, nome (opcional), quantidade de sessões, valor.
- **Contrato** (o nome de domínio; tabela `pacote` por compatibilidade — `agendamento`/`sessao`/
  `lancamento_financeiro` apontam pra `pacoteId`) — registro do cliente que agrupa as sessões: cliente,
  serviço, `planoPacoteId` (nulo = sessão avulsa), profissional, quantidade de sessões, valor pago,
  forma + situação de pagamento, modalidade, observações. **Sem validade**. Nasce no modal "Novo
  agendamento" da agenda (`/painel/agenda`): escolhe serviço → pacote/avulsa → tabela de N datas editáveis
  (pré-preenchida por frequência via `modules/recorrencia/gerar.ts`) → cria 1 contrato + N agendamentos.
  Consumir 1 sessão = marcar um `Agendamento` como `realizado` (derivado). Ver `04-roadmap.md`.
- **Agendamento** — atendimento marcado: cliente, serviço, profissional, data/hora, duração,
  vínculo com contrato (`pacoteId`), status (marcado, realizado, falta, cancelado), observações. `checkinEm`
  registra a confirmação de presença (chegada na clínica; pela agenda, em modal; e via QR Code/link direto
  em `/painel/checkin/[id]`) — independente do status
  "realizado", que só a profissional marca ao concluir o atendimento. `lembreteDiaAnteriorEm`/
  `lembreteHorasAntesEm` (Fase 2) marcam quando cada lembrete baseado em tempo foi disparado pelo
  scheduler — ver `04-roadmap.md`. **Concluir sessão** só fica disponível depois da presença
  confirmada (`checkinEm` preenchido); ao concluir, a agenda abre confirmação em modal: se o contrato
  estiver pendente/parcial (ou a sessão for avulsa), pode lançar a receita daquela sessão no
  financeiro como `pago` ou `pendente`, com valor editável. Após concluir, a profissional é enviada
  para a aba **Sessões** do cliente com o modal de nova sessão aberto e vinculado ao agendamento
  realizado; enquanto esse registro clínico não existir, a aba sinaliza a pendência, e o painel
  principal/perfil do cliente também apontam para essa aba.
- **Ficha / Anamnese** — formulário estruturado por serviço, vinculado ao prontuário do cliente.
  Dinâmica (campos inteligentes). Tem versionamento e status. Detalhe em `07-fichas.md`.
- **Sessao** — registro clínico de um atendimento realizado: serviço, região, equipamentos,
  parâmetros, produtos, duração, relato do cliente, avaliação profissional, escala de dor antes/depois,
  reações, orientações, fotos e medidas. Todo `Agendamento` com status `realizado` deve gerar uma
  `Sessao` vinculada (`agendamentoId`); nesse fluxo, serviço, contrato/pacote e agendamento vêm
  travados do atendimento concluído.
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
- **MedicamentoInformado** (`modules/medicamentos`, Fase 2) — "Medicamentos informados e alertas de
  segurança" do brief: medicamento, dosagem, frequência, profissional prescritor, data de início,
  alergia relacionada, alerta de interação, fonte do alerta. `alertaInteracao` é **sempre texto
  digitado pela profissional** — nunca calculado/sugerido pelo sistema. `verificadoPorId`/
  `verificadoEm` são uma etapa separada e deliberada da criação (informar ≠ verificar). Acesso
  restrito a `profissional`.

## Relações-chave

`Cliente 1—N Contrato` (tabela `pacote`), `Cliente 1—N Agendamento`, `Cliente 1—N Ficha`,
`Cliente 1—N Sessao`, `Cliente 1—N Documento`.
`Servico 1—N Pacote` (`plano_pacote`, as faixas); `Servico`/`Pacote` 1—N `Contrato`.
`Contrato 1—N Agendamento` (o fluxo "Novo agendamento" cria o contrato + as N sessões);
`Contrato 1—N Sessao` (consome sessões). `Sessao 1—N Medida`, `Sessao 1—N Foto`, `Sessao 1—N DorRegistro`.
`Servico` referenciado por `Pacote`(plano), `Contrato`, `Agendamento`, `Ficha`, `Sessao`.
`Produto 1—N Lote 1—N MovimentacaoEstoque` — desacoplado do resto do domínio clínico por ora.
`Cliente 1—N MedicamentoInformado`.

## Glossário

- **Anamnese** — ficha de avaliação inicial com histórico de saúde do cliente.
- **Campo inteligente** — campo que só aparece conforme respostas anteriores (condicional).
- **Antes/depois** — comparação padronizada de fotos ao longo do tratamento.
- **Protocolo** — conjunto de procedimentos/parâmetros aplicados numa sessão.
- **Plano de tratamento** — sequência planejada de sessões com evolução registrada.
