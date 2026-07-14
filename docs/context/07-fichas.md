# Fichas / Anamnese

Módulo central: transforma as fichas de papel em **formulários digitais estruturados**,
vinculados ao prontuário do cliente. Não são cópias duras do papel — **reagem às respostas**.

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
