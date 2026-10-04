CREATE TABLE "conteudo_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"subtitulo" text DEFAULT '' NOT NULL,
	"texto" text DEFAULT '' NOT NULL,
	"tipo_midia" text DEFAULT 'imagem' NOT NULL,
	"midia" text DEFAULT '' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"autorizacao_publicacao" boolean DEFAULT false NOT NULL,
	"atualizado_por_id" uuid,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_conteudo_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conteudo_id" uuid NOT NULL,
	"usuario_id" uuid,
	"dados" jsonb NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conteudo_site" ADD CONSTRAINT "conteudo_site_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_conteudo_site" ADD CONSTRAINT "historico_conteudo_site_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;