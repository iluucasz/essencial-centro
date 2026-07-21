ALTER TABLE "serie_agendamento" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "serie_agendamento" CASCADE;--> statement-breakpoint
ALTER TABLE "agendamento" DROP CONSTRAINT IF EXISTS "agendamento_serie_id_serie_agendamento_id_fk";
--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_profissional_id" uuid;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_frequencia" "frequencia_recorrencia";--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_dia_semana" integer;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_dia_do_mes" integer;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_hora" integer;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_minuto" integer;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_duracao_minutos" integer;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_modalidade" text;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "rec_data_inicio" timestamp;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_rec_profissional_id_usuario_id_fk" FOREIGN KEY ("rec_profissional_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" DROP COLUMN "serie_id";