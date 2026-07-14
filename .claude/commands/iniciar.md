---
description: Conduz o MVP passo a passo — constrói o próximo módulo da ordem e mostra o próximo passo
---

Você é o **condutor do MVP**. Este comando é auto-avançável: cada vez que roda, descobre onde o
projeto parou, constrói o **próximo** módulo na ordem certa e termina dizendo o que vem depois.
O usuário não precisa lembrar a sequência — ele sempre roda `/iniciar` de novo.

## Ordem canônica do MVP (de `docs/context/04-roadmap.md`)

1. `auth` — login profissional/cliente + RBAC
2. `clientes` — cadastro (dados pessoais reutilizáveis)
3. `servicos` — catálogo de serviços
4. `agenda` — agendamentos (status, vínculo a pacote)
5. `pacotes` — sessões contratadas/realizadas/restantes
6. `fichas` — anamnese dinâmica por serviço (ver `07-fichas.md`)
7. `sessoes` — registro de atendimento
8. `medidas` — medidas corporais + escala de dor
9. `fotos` — antes/depois (storage de blobs)
10. `evolucao` — gráficos/tabelas/comparações
11. `notificacoes` — lembretes

## Passos

1. **Descubra o próximo módulo**: liste `modules/`. O próximo é o **primeiro** da ordem acima cuja
   pasta `modules/<nome>/` ainda não existe (ou existe sem `schema.ts`/`actions.ts`). Se todos
   existirem, parabenize e aponte a Fase 2 do roadmap — pare aqui.
2. **Anuncie** ao usuário, em uma linha, qual módulo vai construir agora e por quê.
3. **Leia o contexto necessário** (não o bank inteiro): sempre `03-convencoes.md` e `02-arquitetura.md`;
   `01-dominio.md` para as entidades do módulo; `06-lgpd-seguranca.md` se lida com dado sensível;
   `07-fichas.md` se o módulo for `fichas`. Se for `auth`, leia também os docs reais do Auth.js/Next
   em `node_modules/next/dist/docs/` conforme necessário.
4. **Construa o módulo** seguindo a receita de `03-convencoes.md`: `schema.ts` (Drizzle + Zod,
   reexportado em `db/schema/index.ts`), `queries.ts`, `actions.ts` (sessão → autorização → Zod →
   mutação → revalidate), `components/` só se precisar de UI, e `<nome>.test.ts` cobrindo a regra
   principal **e** a autorização. Textos/domínio em pt-BR, tokens da marca na UI, sem `console.log`.
5. **Valide**: rode `pnpm check` e só conclua com tudo verde. Nunca use `--no-verify`. Se mudou
   domínio/arquitetura, atualize o doc do context bank.
6. **Feche com o próximo passo**, exatamente neste formato:

   ```
   ✅ Módulo <nome> concluído — <resumo em 1 linha do que foi entregue>
   🧪 Portões: verde (typecheck · lint · format · testes)

   👉 Próximo: rode /iniciar de novo — vou construir **<próximo-módulo-da-ordem>**.
   💾 Quer salvar antes? git add -A && git commit -m "feat(<nome>): ..." (e git push)
   ```

Nunca commite nem faça push sozinho — deixe isso para o usuário decidir no passo 💾.
