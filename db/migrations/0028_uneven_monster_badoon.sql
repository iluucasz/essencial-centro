CREATE TABLE "anexo_assistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profissional_id" uuid NOT NULL,
	"nome_arquivo" text NOT NULL,
	"content_type" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"total_paginas" integer,
	"total_caracteres" integer NOT NULL,
	"texto_extraido" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anexo_assistente" ADD CONSTRAINT "anexo_assistente_profissional_id_usuario_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anexo_assistente_profissional_criado_idx" ON "anexo_assistente" USING btree ("profissional_id","criado_em");