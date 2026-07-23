# Fichas / Anamnese

Módulo central: transforma as fichas de papel em **formulários digitais estruturados**,
vinculados ao prontuário do cliente. Não são cópias duras do papel — **reagem às respostas**.

## Status de implementação — modelos dinâmicos (construtor estilo Google Forms)

As fichas deixaram de ser **tipadas em código** e passaram a ser **guiadas por modelo em dados**
(Fase 1 concluída). A profissional cria modelos no construtor e cada modelo pode ser preenchido.

- **`modelo_ficha`** (`modules/fichas/schema.ts`): `campos` em JSONB validado por `camposModeloSchema`
  (`modules/fichas/campos.ts`) — novos modelos sem migração de tabela. CRUD em `modelos-actions.ts` /
  `modelos-queries.ts`; administração em `app/painel/fichas/modelos/`. Não se exclui modelo em uso
  (desativar); dados pessoais do cadastro não se repetem nos campos.
- **Tipos de campo**: `secao`, `paragrafo`, `texto_curto`, `texto_longo`, `numero`, `data`,
  `sim_nao` (com detalhe condicional), `selecao_unica`, `selecao_multipla`, `aceite`. Cada campo tem
  `quemPreenche` (`cliente` | `profissional`) — audiência que filtra o formulário público e o portal.
- **`ficha`** ganhou `modeloFichaId` + `preenchidaPor`; fichas dinâmicas guardam
  `respostas = { [campoId]: valor }`. Fichas legadas (shape `relato/avaliacao/compartilhado`)
  continuam sendo lidas pelo visualizador legado em `components/lista-fichas.tsx`.
- **Renderização única**: `formulario-dinamico.tsx` desenha qualquer modelo (RHF + schema dinâmico);
  `validarRespostasModelo` revalida no servidor (`actions.ts`). Seletor "Nova ficha" +
  "Criar modelo" em `app/painel/clientes/[id]/page.tsx`.
- **Semente**: `modelos-semente.ts` (11 modelos transcritos de `fichas/*.docx`) + `pnpm db:seed`
  (idempotente por `slug`). Os 2 formulários fixos antigos (estética/cílios) viraram modelos.
- **Fase 2 (concluída) — envio por WhatsApp + formulário público**: o seletor "Nova ficha" oferece
  **Preencher** (profissional) ou **Enviar para WhatsApp**. O envio cria uma ficha
  `aguardando_cliente` com `tokenPublico` (aleatório forte, uso único, expira em 14 dias — `token.ts`)
  e manda o link por `enviarWhatsAppTexto` usando `cliente.telefone` direto (não `notificarCliente`,
  que exige conta no portal). A rota **pública** `app/ficha/[token]/` (sem login, fora de painel/portal)
  renderiza só os campos `quemPreenche:"cliente"` (`camposVisiveisParaCliente`); ao enviar
  (`enviarFichaPublica`, autorizada só pelo token), a ficha vira `preenchida` (`preenchidaPor:"cliente"`).
  O envio é único **pelo status** (revisitar o link mostra "Ficha já preenchida", sem expor respostas);
  a action pública **não chama `revalidatePath`** — dentro de Server Action ele re-renderiza a página
  atual e substituiria a tela de sucesso. Se o WhatsApp falhar, a action devolve a URL p/ envio manual.
- **Follow-up**: versionamento de ficha assinada, vínculo automático `servico → modelo`, e exibir a
  ficha dinâmica completa no portal do cliente (hoje o portal mostra só título/status das dinâmicas).

## Fluxo

`Cliente → Novo atendimento → <Serviço> → Abrir anamnese correspondente`.
Dados pessoais comuns (nome, telefone, endereço, nascimento, e-mail) são **reutilizados
automaticamente** do cadastro — não se repreenchem em cada ficha.

## Três áreas de cada formulário

1. **Preenchimento do cliente**: dados pessoais, histórico de saúde, hábitos, medicamentos,
   alergias, queixa principal, confirmação das informações, aceite dos termos.
2. **Preenchimento da profissional**: avaliação técnica, diagnóstico estético, medidas,
   fotografias, procedimentos, parâmetros de aparelhos, protocolo, evolução, observações internas.
3. **Área compartilhada**: resumo do tratamento, orientações, sessões realizadas, próxima sessão,
   evolução de medidas e dores, antes/depois autorizado.

## Campos inteligentes (condicionais)

Aparecem conforme respostas (via `watch()` do react-hook-form):

- "usa medicamento" → qual, dose, frequência.
- "realizou cirurgia" → tipo, data, região.
- "gestante" → quantas semanas.
- "alergia" → qual substância, qual reação.
- contraindicação importante → **alerta para a profissional**.
- sexo masculino → perguntas de barba quando pertinente.
- procedimento selecionado → só os campos necessários.

## Catálogo de fichas (por serviço)

- **Extensão de cílios** — dados pessoais, histórico ocular, alergias, gestação/lactação, cirurgias, termo.
- **Estética corporal** — objetivo, histórico de saúde, hábitos, tabela de medidas (abdômen, quadril, glúteos, pernas, braços) por sessão.
- **Ozonioterapia** — histórico clínico por sistemas, medicamentos, contraindicações, termo, protocolo, controle de até 15 sessões.
- **Terapia capilar** — hábitos, alimentação, cosméticos, características de cabelo/couro cabeludo, patologias, químicas anteriores.
- **Limpeza de pele masculina** — hábitos, alergias, medicamentos, doenças, barba, fototipo, oleosidade, acne, textura, avaliação.
- **Limpeza de pele feminina** — hormonal, gestação, anticoncepcional, doenças, fototipo, acne, textura, oleosidade, avaliação facial.
- **Criolipólise** — histórico clínico, contraindicações, medidas corporais, autorização específica de imagens.
- **Massoterapia** — tipo de massagem, objetivo, histórico de saúde, hábitos, observações, termo.
- **Depilação** — técnicas usadas, reações, alergias, varizes, gestação, lesões, observações pré-procedimento.
- **Plano de tratamento** — registro por sessão: data, descrição, confirmação do cliente.
- **Contrato de prestação de serviços** — cuidados, efeitos possíveis, regras financeiras, frequência, faltas/atrasos, tratamento contratado.

## Medidas e evolução

Tabelas de medida viram registros por sessão: data, região, lado (D/E), inicial, atual, diferença,
sessão, profissional. Corporal inclui: 5cm acima do umbigo, linha do umbigo, 5cm abaixo, quadril,
glúteo, coxa D/E, braço D/E. Apresentar em **gráfico + tabela comparativa**.

## Assinaturas e documentos

Cliente pode confirmar veracidade, assinar termo/contrato, autorizar/negar imagens (separado),
receber cópia digital (PDF) e consultar documentos assinados depois. Versionamento: `06-lgpd-seguranca.md`.

## Modelagem sugerida

Uma tabela `ficha` genérica (cliente, serviço, tipo, status, versão, assinaturas, auditoria) +
`respostas` em coluna JSONB validada por **schema Zod por tipo de ficha**. Assim novos tipos de
ficha entram sem migração de tabela, mantendo validação forte no código.
