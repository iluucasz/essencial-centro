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
  ("um dia antes", "algumas horas antes") ficam para quando houver um scheduler (Vercel Cron ou
  equivalente) — não existe hoje.
- ✅ Área de evolução do cliente (gráficos/tabelas/comparações) — `modules/evolucao`.
- ✅ Termos e consentimentos (separados) + histórico de alterações — dentro de `modules/fichas`
  (aceite + autorização de imagem separados). Versionamento de ficha assinada (`versaoAnteriorId`)
  tem schema pronto mas ainda sem fluxo de edição.

## Fase 2

Financeiro completo · assinatura eletrônica · presença por QR Code · relatórios avançados ·
estoque e lotes · atendimento domiciliar com rota · integração WhatsApp · emissão de documentos ·
lembretes por e-mail/SMS/push (hoje só in-app) · scheduler para lembretes baseados em tempo ·
alertas de medicamentos ("Medicamentos informados e alertas de segurança" — **apoio**, exige
validação profissional; nunca decisão clínica automática).

## Fase 3

Biometria · integração com equipamentos · prescrição eletrônica (quando juridicamente aplicável) ·
inteligência para comparação de evolução · integrações externas · publicação nas lojas.

## Ordem sugerida de construção (Fase 1)

auth → clientes → servicos → agenda → pacotes → fichas → sessoes → medidas/dor → fotos → evolucao → notificações.
Cada passo = um módulo (ver `03-convencoes.md`), mantendo build/typecheck verdes.
