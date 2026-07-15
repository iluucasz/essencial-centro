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
export * from "../../modules/servicos/schema";
export * from "../../modules/pacotes/schema";
export * from "../../modules/agenda/schema";
export * from "../../modules/fichas/schema";
export * from "../../modules/sessoes/schema";
export * from "../../modules/medidas/schema";
export * from "../../modules/fotos/schema";
export * from "../../modules/notificacoes/schema";
export * from "../../modules/financeiro/schema";
export * from "../../modules/documentos/schema";
