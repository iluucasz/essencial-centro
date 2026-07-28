/**
 * Compara o schema Drizzle (db/schema/index.ts) com o banco real e aponta divergências.
 *
 * Existe porque o erro mais caro do projeto é silencioso em dev e explode só em runtime: a tabela
 * ganha coluna no schema, a migration é gerada mas não aplicada, e toda query daquela tabela passa
 * a falhar com `column "x" does not exist` (42703) — o typecheck não pega, os testes não pegam.
 *
 * Uso: `pnpm db:drift`. Sai com código 1 se houver divergência (serve em CI).
 */
/* eslint-disable no-console -- script de linha de comando */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { is } from "drizzle-orm";
import { PgTable as PgTableClass } from "drizzle-orm/pg-core";

import * as schema from "../db/schema/index.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function carregarEnv() {
  for (const arquivo of [".env.local", ".env"]) {
    let conteudo: string;

    try {
      conteudo = readFileSync(join(raiz, arquivo), "utf8");
    } catch {
      continue;
    }

    for (const linha of conteudo.split("\n")) {
      const igual = linha.indexOf("=");
      if (igual === -1 || linha.trim().startsWith("#")) continue;

      const chave = linha.slice(0, igual).trim();
      const valor = linha
        .slice(igual + 1)
        .replace(/\r/g, "")
        .trim()
        .replace(/^["']|["']$/g, "");

      if (chave && !process.env[chave]) process.env[chave] = valor;
    }
  }
}

/** Tabelas declaradas no código, extraídas do barrel via metadados do Drizzle. */
function tabelasDoSchema() {
  const tabelas = new Map<string, Set<string>>();

  for (const exportado of Object.values(schema)) {
    if (!is(exportado, PgTableClass)) continue;

    const config = getTableConfig(exportado as PgTable);
    tabelas.set(config.name, new Set(config.columns.map((coluna) => coluna.name)));
  }

  return tabelas;
}

async function main() {
  carregarEnv();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definida. Copie .env.example para .env.local.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const problemas: string[] = [];

  // 1. Migrations do journal que ainda não foram aplicadas no banco.
  const journal = JSON.parse(
    readFileSync(join(raiz, "db/migrations/meta/_journal.json"), "utf8"),
  ) as { entries: { tag: string }[] };
  const aplicadas = await sql`select hash from drizzle.__drizzle_migrations`;

  if (journal.entries.length !== aplicadas.length) {
    const pendentes = journal.entries.slice(aplicadas.length).map((e) => e.tag);
    problemas.push(`migrations pendentes (${pendentes.join(", ")}) — rode pnpm db:migrate`);
  }

  // 2. Tabelas/colunas do schema-fonte que não existem no banco (e vice-versa).
  const colunas = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'`;

  const banco = new Map<string, Set<string>>();
  for (const linha of colunas as { table_name: string; column_name: string }[]) {
    if (!banco.has(linha.table_name)) banco.set(linha.table_name, new Set());
    banco.get(linha.table_name)!.add(linha.column_name);
  }

  const codigo = tabelasDoSchema();

  for (const [tabela, colunasCodigo] of codigo) {
    const colunasBanco = banco.get(tabela);

    if (!colunasBanco) {
      problemas.push(`tabela no código mas não no banco: ${tabela}`);
      continue;
    }

    for (const coluna of colunasCodigo) {
      if (!colunasBanco.has(coluna)) {
        problemas.push(`coluna no código mas não no banco: ${tabela}.${coluna}`);
      }
    }

    for (const coluna of colunasBanco) {
      if (!colunasCodigo.has(coluna)) {
        problemas.push(`coluna no banco mas não no código: ${tabela}.${coluna}`);
      }
    }
  }

  for (const tabela of banco.keys()) {
    if (!codigo.has(tabela)) problemas.push(`tabela no banco mas não no código: ${tabela}`);
  }

  // 3. Enums do último snapshot vs. banco — `ALTER TYPE ADD VALUE` é fácil de esquecer.
  const arquivosSnapshot = readdirSync(join(raiz, "db/migrations/meta"))
    .filter((arquivo) => arquivo.endsWith("_snapshot.json"))
    .sort();
  const snapshot = JSON.parse(
    readFileSync(join(raiz, "db/migrations/meta", arquivosSnapshot.at(-1)!), "utf8"),
  ) as { enums?: Record<string, { name: string; values: string[] }> };

  const enumsBanco = await sql`
    select t.typname, string_agg(e.enumlabel, '|' order by e.enumsortorder) as labels
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    group by 1`;

  const mapaEnums = new Map(
    (enumsBanco as { typname: string; labels: string }[]).map((linha) => [
      linha.typname,
      linha.labels.split("|"),
    ]),
  );

  for (const enumSnapshot of Object.values(snapshot.enums ?? {})) {
    const valoresBanco = mapaEnums.get(enumSnapshot.name);

    if (!valoresBanco) {
      problemas.push(`enum no snapshot mas não no banco: ${enumSnapshot.name}`);
      continue;
    }

    const faltando = enumSnapshot.values.filter((valor) => !valoresBanco.includes(valor));
    if (faltando.length) {
      problemas.push(
        `enum ${enumSnapshot.name}: valores faltando no banco: ${faltando.join(", ")}`,
      );
    }
  }

  if (problemas.length) {
    console.error(`\n${problemas.length} divergência(s) entre schema e banco:\n`);
    for (const problema of problemas) console.error(`  - ${problema}`);
    process.exit(1);
  }

  console.log(
    `schema e banco em sincronia — ${codigo.size} tabelas, ${journal.entries.length} migrations aplicadas.`,
  );
}

void main();
