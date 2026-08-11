CREATE TYPE "public"."tipo_analise" AS ENUM('exame', 'biorressonancia', 'recomendacao');--> statement-breakpoint
CREATE TABLE "analise_clinica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" "tipo_analise" NOT NULL,
	"titulo" text NOT NULL,
	"arquivo_pathname" text,
	"arquivo_nome" text,
	"arquivo_content_type" text,
	"arquivo_tamanho_bytes" integer,
	"texto_extraido" text,
	"analise_ia" text NOT NULL,
	"modelo_ia" text NOT NULL,
	"observacao_profissional" text,
	"revisado_por_id" uuid,
	"revisado_em" timestamp,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analise_clinica" ADD CONSTRAINT "analise_clinica_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analise_clinica" ADD CONSTRAINT "analise_clinica_revisado_por_id_usuario_id_fk" FOREIGN KEY ("revisado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analise_clinica" ADD CONSTRAINT "analise_clinica_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;