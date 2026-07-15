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

Restante, em ordem sugerida: lembretes por e-mail/SMS/push (depende do scheduler, já resolvido
acima; exige decidir provedor) · alertas de medicamentos ("Medicamentos informados e alertas de
segurança" — **apoio**, exige validação profissional; nunca decisão clínica automática) ·
atendimento domiciliar com rota · integração WhatsApp (maior dependência externa — API/aprovação
de negócio — por último).

## Fase 3

Biometria · integração com equipamentos · prescrição eletrônica (quando juridicamente aplicável) ·
inteligência para comparação de evolução · integrações externas · publicação nas lojas.

## Ordem sugerida de construção (Fase 1)

auth → clientes → servicos → agenda → pacotes → fichas → sessoes → medidas/dor → fotos → evolucao → notificações.
Cada passo = um módulo (ver `03-convencoes.md`), mantendo build/typecheck verdes.
