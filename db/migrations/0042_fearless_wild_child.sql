ALTER TABLE "campanha_mensagem" ADD COLUMN "arquivo_pathname" text;--> statement-breakpoint
ALTER TABLE "campanha_mensagem" ADD COLUMN "arquivo_nome" text;--> statement-breakpoint
ALTER TABLE "campanha_mensagem" ADD COLUMN "arquivo_content_type" text;--> statement-breakpoint
ALTER TABLE "campanha_mensagem" ADD COLUMN "arquivo_tamanho_bytes" integer;--> statement-breakpoint
ALTER TABLE "mensagem_predefinida" ADD COLUMN "arquivo_pathname" text;--> statement-breakpoint
ALTER TABLE "mensagem_predefinida" ADD COLUMN "arquivo_nome" text;--> statement-breakpoint
ALTER TABLE "mensagem_predefinida" ADD COLUMN "arquivo_content_type" text;--> statement-breakpoint
ALTER TABLE "mensagem_predefinida" ADD COLUMN "arquivo_tamanho_bytes" integer;