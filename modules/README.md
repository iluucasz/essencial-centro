# modules/

Módulos de **domínio** (feature-based). Cada pasta é uma capacidade do produto e é a
unidade de escala do projeto: para adicionar uma feature, cria-se/edita-se **um** módulo,
sem espalhar código pelo resto da base.

## Anatomia de um módulo

```
modules/<nome>/
  schema.ts        # tabelas Drizzle + schemas Zod (drizzle-zod) do módulo
  queries.ts       # leituras (Server Components / server-only)
  actions.ts       # Server Actions (mutações), com "use server"
  components/      # UI específica do módulo
  <nome>.types.ts  # tipos derivados (opcional)
```

Regras:

- Tabelas do módulo também são reexportadas em `db/schema/index.ts`.
- Nada de import cruzado entre módulos por caminhos internos — exponha pelo `index.ts` do módulo.
- Lógica reutilizável entre módulos vai para `lib/`.

Módulos planejados (MVP): `auth`, `clientes`, `servicos`, `agenda`, `pacotes`,
`fichas`, `sessoes`, `medidas`, `fotos`, `evolucao`. Ver `docs/context/04-roadmap.md`.
