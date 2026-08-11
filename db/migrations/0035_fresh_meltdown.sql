ALTER TYPE "public"."status_agendamento" ADD VALUE 'aguardando_confirmacao' BEFORE 'marcado';--> statement-breakpoint
ALTER TYPE "public"."status_agendamento" ADD VALUE 'recusado';--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "token_confirmacao" text;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "token_expira_em" timestamp;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "confirmacao_enviada_em" timestamp;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "confirmado_em" timestamp;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "recusado_em" timestamp;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "motivo_recusa" text;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_token_confirmacao_unique" UNIQUE("token_confirmacao");