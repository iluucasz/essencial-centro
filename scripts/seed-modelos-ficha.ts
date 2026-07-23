/**
 * Semeia os modelos de ficha (modules/fichas/modelos-semente.ts) no banco. Idempotente:
 * `ON CONFLICT (slug) DO NOTHING` — re-rodar não sobrescreve modelos que a profissional editou.
 *
 * Uso: `pnpm db:seed`
 */
/* eslint-disable no-console -- script de linha de comando */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { neon } from "@neondatabase/serverless";

import { modelosSemente } from "../modules/fichas/modelos-semente.ts";

function carregarEnv() {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

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

async function main() {
  carregarEnv();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não definida (.env / .env.local).");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  let inseridos = 0;
  let existentes = 0;

  for (const modelo of modelosSemente) {
    const linhas = await sql`
      INSERT INTO modelo_ficha (slug, nome, descricao, campos, ativo)
      VALUES (${modelo.slug}, ${modelo.nome}, ${modelo.descricao}, ${JSON.stringify(modelo.campos)}::jsonb, true)
      ON CONFLICT (slug) DO NOTHING
      RETURNING slug
    `;

    if (linhas.length > 0) {
      inseridos += 1;
      console.log(`+ ${modelo.slug}`);
    } else {
      existentes += 1;
      console.log(`= ${modelo.slug} (já existe)`);
    }
  }

  console.log(`\nConcluído: ${inseridos} inseridos, ${existentes} já existentes.`);
}

main().catch((erro) => {
  console.error("Falha ao semear modelos:", erro);
  process.exit(1);
});
