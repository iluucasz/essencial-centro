# Context Bank — Essencial Centro

Base de contexto do projeto, versionada no repo. Objetivo: **um agente (ou pessoa) carrega só
o que precisa** para a tarefa, gastando o mínimo de contexto e mantendo qualidade e consistência.

## Como usar (para o agente)

1. `AGENTS.md` (raiz) é sempre lido — dá as regras e aponta para cá.
2. Carregue **apenas** o(s) doc(s) relevante(s) à tarefa (tabela abaixo). Não leia o bank inteiro.
3. Ao criar/mudar decisões de arquitetura, dados ou fluxo, **atualize o doc correspondente** na mesma tarefa.
4. `brief.md` é a fonte bruta original do cliente — consulte só quando faltar detalhe; o resto do bank é o destilado.

## Índice

| Doc | Leia quando… |
|-----|--------------|
| `00-produto.md` | precisar da visão, público e papéis de acesso |
| `01-dominio.md` | mexer em entidades/dados; precisar do glossário |
| `02-arquitetura.md` | criar módulo, rota, camada de dados, auth, deploy; decisões de stack |
| `03-convencoes.md` | escrever código: como adicionar feature, naming, forms, actions |
| `04-roadmap.md` | decidir o que construir agora (MVP fase 1/2/3) |
| `05-design-system.md` | qualquer UI: paleta, tokens, componentes, direção visual |
| `06-lgpd-seguranca.md` | dados sensíveis, permissões, consentimentos, auditoria |
| `07-fichas.md` | módulo de fichas/anamnese: catálogo, campos inteligentes, estrutura |
| `brief.md` | fonte original completa (referência) |
