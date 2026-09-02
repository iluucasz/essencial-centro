CREATE TYPE "public"."tipo_controle" AS ENUM('calibracao_equipamentos', 'limpeza_caixa_dagua', 'dedetizacao', 'coleta_materiais');--> statement-breakpoint
CREATE TABLE "registro_controle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_controle" NOT NULL,
	"data_realizacao" date NOT NULL,
	"arquivo_pathname" text,
	"arquivo_nome" text,
	"arquivo_content_type" text,
	"arquivo_tamanho_bytes" integer,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registro_controle" ADD CONSTRAINT "registro_controle_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;