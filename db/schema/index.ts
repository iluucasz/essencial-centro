/**
 * Barrel do schema Drizzle. Cada módulo declara suas tabelas em db/schema/<modulo>.ts
 * e reexporta aqui. Convenções: docs/context/03-convencoes.md
 *
 * Ex.: export * from "./clientes";
 *      export * from "./auth";
 *
 */
export * from "../../modules/auth/schema";
export * from "../../modules/clientes/schema";
