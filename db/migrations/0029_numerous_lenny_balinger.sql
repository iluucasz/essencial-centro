CREATE TYPE "public"."preenchida_por_ficha" AS ENUM('profissional', 'cliente');--> statement-breakpoint
CREATE TABLE "modelo_ficha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"campos" jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modelo_ficha_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ficha" ALTER COLUMN "tipo" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ficha" ADD COLUMN "modelo_ficha_id" uuid;--> statement-breakpoint
ALTER TABLE "ficha" ADD COLUMN "preenchida_por" "preenchida_por_ficha";--> statement-breakpoint
ALTER TABLE "modelo_ficha" ADD CONSTRAINT "modelo_ficha_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo_ficha" ADD CONSTRAINT "modelo_ficha_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_modelo_ficha_id_modelo_ficha_id_fk" FOREIGN KEY ("modelo_ficha_id") REFERENCES "public"."modelo_ficha"("id") ON DELETE set null ON UPDATE no action;