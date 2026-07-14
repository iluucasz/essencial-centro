import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env.local.");
}

const sql = neon(process.env.DATABASE_URL);

/** Cliente Drizzle único do app. Importe como `import { db } from "@/db"`. */
export const db = drizzle(sql, { schema });

export * from "./schema";
