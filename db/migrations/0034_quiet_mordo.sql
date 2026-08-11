ALTER TABLE "analise_clinica" ADD COLUMN "analise_ia_original" text;--> statement-breakpoint
ALTER TABLE "analise_clinica" ADD COLUMN "refinamentos" jsonb DEFAULT '[]'::jsonb NOT NULL;