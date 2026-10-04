ALTER TABLE "conteudo_site" ADD COLUMN "filtro" text DEFAULT 'original' NOT NULL;--> statement-breakpoint
ALTER TABLE "conteudo_site" ADD COLUMN "som_original" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "conteudo_site" ADD COLUMN "musica" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "conteudo_site" ADD COLUMN "volume_musica" integer DEFAULT 60 NOT NULL;