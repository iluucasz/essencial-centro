ALTER TABLE "pacote" DROP CONSTRAINT "pacote_rec_profissional_id_usuario_id_fk";
--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "validade";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_profissional_id";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_frequencia";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_dia_semana";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_dia_do_mes";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_hora";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_minuto";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_duracao_minutos";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_modalidade";--> statement-breakpoint
ALTER TABLE "pacote" DROP COLUMN "rec_data_inicio";