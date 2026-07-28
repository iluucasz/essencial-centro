ALTER TYPE "public"."tipo_documento" ADD VALUE 'biorressonancia' BEFORE 'outro';--> statement-breakpoint
ALTER TABLE "documento" ADD COLUMN "arquivo_pathname" text;--> statement-breakpoint
ALTER TABLE "documento" ADD COLUMN "arquivo_nome" text;--> statement-breakpoint
ALTER TABLE "documento" ADD COLUMN "arquivo_content_type" text;--> statement-breakpoint
ALTER TABLE "documento" ADD COLUMN "arquivo_tamanho_bytes" integer;--> statement-breakpoint
ALTER TABLE "anexo_assistente" ADD COLUMN "pathname" text;