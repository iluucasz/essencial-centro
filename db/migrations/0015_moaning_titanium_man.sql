ALTER TYPE "public"."tipo_notificacao" ADD VALUE 'lembrete_dia_anterior' BEFORE 'geral';--> statement-breakpoint
ALTER TYPE "public"."tipo_notificacao" ADD VALUE 'lembrete_horas_antes' BEFORE 'geral';--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "lembrete_dia_anterior_em" timestamp;--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "lembrete_horas_antes_em" timestamp;