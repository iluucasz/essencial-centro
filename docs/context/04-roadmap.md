# Roadmap

Princípio: não virar "polvo tecnológico" no começo. Entregar o MVP enxuto e evoluir por fases.

## Fase 1 — MVP ✅ concluída

- ✅ Login profissional e cliente (Auth.js) + controle de permissões (RBAC) — `modules/auth`.
- ✅ Cadastro de clientes (dados pessoais reutilizáveis) — `modules/clientes`.
- ✅ Cadastro de serviços — `modules/servicos`.
- ✅ Agenda (criar/remarcar/cancelar, status, vínculo a pacote) — `modules/agenda`.
- ✅ Ficha de avaliação (anamnese estruturada por serviço) — `modules/fichas`. Só o tipo
  `estetica_corporal` implementado; os outros 10 do catálogo entram um de cada vez (ver `07-fichas.md`).
- ✅ Registro de sessões — `modules/sessoes`.
- ✅ Medidas corporais + escala de dor — `modules/medidas` (medidas) e dor em `modules/sessoes`.
- ✅ Fotografias antes/depois — `modules/fotos` (Vercel Blob). ⚠️ Store em modo público, não
  privado — ver alerta em `06-lgpd-seguranca.md` antes de subir fotos reais de pacientes.
- ✅ Pacotes e sessões restantes — `modules/pacotes`.
- ✅ Notificações (lembretes) — `modules/notificacoes`, central in-app disparada por evento
  (agendamento criado, orientações pós-sessão, pacote acabando). Lembretes **baseados em tempo**
  ("um dia antes", "algumas horas antes") foram para a Fase 2 — ver scheduler abaixo.
- ✅ Área de evolução do cliente (gráficos/tabelas/comparações) — `modules/evolucao`.
- ✅ Termos e consentimentos (separados) + histórico de alterações — dentro de `modules/fichas`
  (aceite + autorização de imagem separados). Versionamento de ficha assinada (`versaoAnteriorId`)
  tem schema pronto mas ainda sem fluxo de edição.

## Fase 2

- ✅ Financeiro completo — `modules/financeiro`. Lançamentos de receita/despesa (avulsos ou
  vinculados a cliente/pacote), situação (pendente/pago/cancelado) e resumo (recebido, pago,
  saldo). Acesso restrito a `profissional` — mais amplo que o controle de pagamento por pacote já
  existente na Fase 1 (`modules/pacotes`), por isso não liberado para `recepcao`.
- ✅ Presença por QR Code — em `modules/agenda` (`checkin.ts`, coluna `checkinEm`). O cliente vê um
  QR Code (gerado com a lib `qrcode`, sem dependência de canvas nativo) em `/portal/agendamentos`
  para cada atendimento marcado; mostra na recepção, que abre com a câmera do celular (sem scanner
  dentro do app) e cai em `/painel/checkin/[id]` — página do painel (profissional/recepção) que
  confirma a presença com um clique. Distinto do status "Realizado" (que só a profissional marca
  ao concluir o atendimento).

- ✅ Relatórios avançados — `modules/relatorios` (`/painel/relatorios`, restrito a `profissional`).
  Agrega, por período (padrão: mês atual), o financeiro (`calcularResumoFinanceiro`), agendamentos
  por status, taxa de comparecimento (realizados/(realizados+faltas)), ranking de serviços mais
  realizados e novos clientes. Só leitura — sem tabela própria, reusa `modules/agenda`,
  `modules/financeiro` e `modules/clientes`.

- ✅ Emissão de documentos — `modules/documentos` (`documento`: tipo, título, conteúdo, status
  emitido/assinado). Profissional emite (contrato, termo de responsabilidade, termo de autorização
  de imagem, orientação ou outro) na ficha do cliente (`/painel/clientes/[id]`, seção "Documentos e
  termos", restrito a `profissional` — mesmo critério de `fichas`/`sessoes`); cliente vê e assina em
  `/portal/documentos`, com "Imprimir/Salvar PDF" via impressão do navegador (`window.print()` +
  `print:hidden`, sem lib de PDF nova).
- ✅ Assinatura eletrônica — mesmo `modules/documentos`. Segue o padrão do brief ("assinatura
  digital simples na tela") em vez de um provedor pago (Clicksign/DocuSign exigiriam conta e chave
  de API que não temos configuradas): `PainelAssinatura` é um `<canvas>` desenhado com o dedo/mouse
  (`modules/documentos/components/painel-assinatura.tsx`), validado no servidor
  (`assinaturaValida` — rejeita canvas em branco, nunca confia só no client) e acompanhado de
  evidências capturadas **no servidor** (nunca do input do cliente): IP (`x-forwarded-for`),
  user-agent, e hash SHA-256 do `conteudo` no momento da assinatura (`calcularHashConteudo`, prova
  de integridade — o que exatamente foi assinado). Profissional também tem uma tela de detalhe
  read-only (`/painel/clientes/[id]/documentos/[documentoId]`) pra conferir a mesma evidência.

- ✅ Estoque e lotes — `modules/estoque` (`/painel/estoque`, restrito a `profissional` — não está
  nas 15 telas do profissional listadas no brief nem nas capacidades de `recepcao`; é "campo de
  operações internas", invisível ao cliente). `produto` (catálogo) → `lote` (cada remessa recebida,
  com validade/fornecedor/custo) → `movimentacaoEstoque` (só saídas — o próprio `lote` já é a
  entrada). Disponível de cada lote/produto é **computado**, não guardado
  (`calcularQuantidadeDisponivel` = inicial − saídas, nunca negativo — mesmo padrão de
  `pacotes/progresso.ts`), o que dá rastro de quem consumiu o quê sem um campo mutável solto.
  Badge de estoque baixo (`deveAvisarEstoqueBaixo`, só quando o produto define mínimo) e de
  validade (`calcularStatusValidade`: vencido/vence em 30 dias/ok), lendo direto o "Lotes e
  validade de produtos" citado no brief. Não integra com `sessao.produtosAplicados` (continua
  texto livre) — decisão de manter os dois módulos desacoplados por ora.

- ✅ Scheduler para lembretes baseados em tempo — `app/api/cron/lembretes` (Vercel Cron,
  `vercel.json`), protegido por `CRON_SECRET` (padrão oficial da Vercel: header
  `Authorization: Bearer $CRON_SECRET`, comparado no próprio Route Handler — nunca confia em nada
  além disso, não há sessão de usuário numa chamada de cron). `modules/agenda/lembretes.ts` decide
  quem precisa de lembrete de forma **idempotente por construção**: dispara "na primeira execução
  em que faltam ≤24h/≤3h pro atendimento", não numa janela estreita de horário — então funciona
  corretamente não importa a frequência real do disparo (bom, porque a Vercel documenta que
  entregas de cron podem falhar ou duplicar — idempotência é a recomendação oficial deles, não só
  uma escolha nossa). Os dois carimbos `agendamento.lembreteDiaAnteriorEm`/`lembreteHorasAntesEm`
  são o que evita duplicar. **Pendência real de infraestrutura**: no plano Hobby (gratuito) da
  Vercel, cron só roda **uma vez por dia** (`vercel.json` está configurado com `"0 11 * * *"`,
  11h UTC ≈ 8h em Brasília) — isso cobre bem o lembrete "um dia antes", mas o lembrete "algumas
  horas antes" só vai disparar com precisão de fato se (a) o projeto estiver no plano Pro da
  Vercel, ou (b) um gatilho externo (ex.: cron-job.org, GitHub Actions agendado) chamar o mesmo
  endpoint autenticado com mais frequência — o endpoint em si já funciona corretamente com
  qualquer frequência de chamada, só a pontualidade do "algumas horas antes" depende de quem/como
  ele é disparado.

- ✅ Alertas de medicamentos — `modules/medicamentos` (`medicamentoInformado`, seção "Medicamentos
  informados e alertas de segurança" em `/painel/clientes/[id]`, restrito a `profissional`). Campos
  exatamente os sugeridos no brief: medicamento, dosagem, frequência, profissional prescritor, data
  de início, alergia relacionada, alerta de interação, fonte do alerta. **`alertaInteracao` é
  preenchido manualmente pela profissional — o sistema nunca sugere/calcula interações** (a
  restrição mais explícita do brief para essa área). "Informar" e "verificar" são duas ações
  separadas de propósito: `criarMedicamentoInformado` só registra; `confirmarVerificacaoMedicamento`
  é um clique deliberado à parte (`precisaVerificacao`/`contarPendentesVerificacao`), sempre exigindo
  conferência de uma profissional — nunca confirmado sozinho na criação. Não depende do scheduler
  (só o item de e-mail/SMS/push abaixo depende).

- ✅ Lembretes por e-mail — `modules/notificacoes/email.ts` (Brevo, `POST /v3/smtp/email` direto
  via `fetch`, sem SDK — chamada única não justifica dependência nova). Sem SMS (não pedido) e sem
  push nesta rodada. Integrado como reforço do `notificarCliente` já existente: **todo** tipo de
  notificação (agendamento criado, sessão concluída, pacote acabando, os dois lembretes do
  scheduler, geral) agora também vira e-mail — um único ponto de integração, sem duplicar lógica
  por tipo. Nunca bloqueante: sem `BREVO_API_KEY`/`BREVO_SENDER_EMAIL` configuradas, ou se a chamada
  falhar, o envio é pulado silenciosamente (só loga o erro) — o canal in-app já cobriu a entrega.
  **Pendência de infraestrutura, fora do meu alcance**: o remetente precisa estar verificado
  (domínio ou remetente único) no painel da Brevo antes de enviar de verdade — sem isso, a Brevo
  rejeita a chamada mesmo com a chave certa.

- ✅ Lembretes por WhatsApp — `modules/notificacoes/whatsapp.ts` (Evolution API v2.3.7, self-hosted
  pelo cliente na Zeabur — VPS Tencent Cloud São Paulo, instância "lucas"). Descartamos a Cloud API
  oficial da Meta (deixou de ser gratuita pra mensagem iniciada pela clínica, ~R$0,04–0,05/utility
  template) depois que o cliente decidiu hospedar a própria Evolution API — a preocupação original
  com libs não-oficiais (Baileys por trás, risco de ban, exige processo persistente incompatível
  com serverless) foi absorvida pelo próprio cliente ao escolher esse caminho; a aplicação só fala
  HTTP com a instância já publicada, sem gerenciar a sessão do WhatsApp Web. `POST
{EVOLUTION_API_URL}/message/sendText/{instance}` (header `apikey`, corpo `{ number, text }`) —
  mesmo padrão "nunca lança, resultado estruturado, desativa sem as 3 env vars" já usado no e-mail
  (`ResultadoEnvioCanal` compartilhado em `modules/notificacoes/tipos.ts`). Integrado como reforço
  do `notificarCliente`: roda em paralelo ao e-mail via `Promise.all`, sempre que o cliente tem
  telefone cadastrado; falha de WhatsApp nunca bloqueia o fluxo principal nem o e-mail. Normalização
  de telefone assume DDI 55 (Brasil) e trata o caso do DDD 55 real (Santa Maria/RS) por tamanho do
  número, não só prefixo. Diagnóstico manual (status da conexão + envio de teste) em
  `/painel/configuracoes`, sempre `profissional`, nunca chamado em polling.

Restante: atendimento domiciliar com rota.

## Fase 3

Biometria · integração com equipamentos · prescrição eletrônica (quando juridicamente aplicável) ·
inteligência para comparação de evolução · integrações externas · publicação nas lojas.

## Ordem sugerida de construção (Fase 1)

auth → clientes → servicos → agenda → pacotes → fichas → sessoes → medidas/dor → fotos → evolucao → notificações.
Cada passo = um módulo (ver `03-convencoes.md`), mantendo build/typecheck verdes.
