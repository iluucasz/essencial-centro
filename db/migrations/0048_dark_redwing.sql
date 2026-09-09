CREATE TYPE "public"."funcao_usuario" AS ENUM('admin', 'manager', 'reader');--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "funcao" "funcao_usuario";--> statement-breakpoint
ALTER TABLE "usuario" ADD COLUMN "cargo" text;--> statement-breakpoint
-- Preserva o acesso que já existia antes de "função" existir: profissional tinha acesso total
-- (financeiro/relatórios/usuários incluídos) -> vira admin. Recepção tinha acesso operacional total
-- (agendar, editar cliente etc., sem financeiro/relatórios/usuários) -> vira manager, não reader,
-- senão a recepção perderia a capacidade de agendar no instante em que este deploy for pro ar.
UPDATE "usuario" SET "funcao" = 'admin' WHERE "role" = 'profissional' AND "funcao" IS NULL;--> statement-breakpoint
UPDATE "usuario" SET "funcao" = 'manager' WHERE "role" = 'recepcao' AND "funcao" IS NULL;