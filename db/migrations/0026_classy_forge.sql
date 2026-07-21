ALTER TABLE "pacote" ADD COLUMN "plano_pacote_id" uuid;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "profissional_id" uuid;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "modalidade" text;--> statement-breakpoint
ALTER TABLE "pacote" ADD COLUMN "observacoes" text;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_plano_pacote_id_plano_pacote_id_fk" FOREIGN KEY ("plano_pacote_id") REFERENCES "public"."plano_pacote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_profissional_id_usuario_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;