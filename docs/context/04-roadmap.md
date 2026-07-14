# Roadmap

Princípio: não virar "polvo tecnológico" no começo. Entregar o MVP enxuto e evoluir por fases.

## Fase 1 — MVP
- Login profissional e cliente (Auth.js) + controle de permissões (RBAC).
- Cadastro de clientes (dados pessoais reutilizáveis).
- Cadastro de serviços.
- Agenda (criar/remarcar/cancelar, status, vínculo a pacote).
- Ficha de avaliação (anamnese estruturada por serviço).
- Registro de sessões.
- Medidas corporais + escala de dor.
- Fotografias antes/depois (storage de blobs).
- Pacotes e sessões restantes.
- Notificações (lembretes).
- Área de evolução do cliente (gráficos/tabelas/comparações).
- Termos e consentimentos (separados) + histórico de alterações.

## Fase 2
Financeiro completo · assinatura eletrônica · presença por QR Code · relatórios avançados ·
estoque e lotes · atendimento domiciliar com rota · integração WhatsApp · emissão de documentos ·
alertas de medicamentos ("Medicamentos informados e alertas de segurança" — **apoio**, exige
validação profissional; nunca decisão clínica automática).

## Fase 3
Biometria · integração com equipamentos · prescrição eletrônica (quando juridicamente aplicável) ·
inteligência para comparação de evolução · integrações externas · publicação nas lojas.

## Ordem sugerida de construção (Fase 1)
auth → clientes → servicos → agenda → pacotes → fichas → sessoes → medidas/dor → fotos → evolucao → notificações.
Cada passo = um módulo (ver `03-convencoes.md`), mantendo build/typecheck verdes.
