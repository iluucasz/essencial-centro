ALTER TYPE "public"."status_ficha" ADD VALUE 'aguardando_cliente' BEFORE 'preenchida';--> statement-breakpoint
ALTER TABLE "ficha" ADD COLUMN "token_publico" text;--> statement-breakpoint
ALTER TABLE "ficha" ADD COLUMN "token_expira_em" timestamp;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_token_publico_unique" UNIQUE("token_publico");