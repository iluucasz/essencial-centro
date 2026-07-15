CREATE TYPE "public"."status_ficha" AS ENUM('rascunho', 'preenchida', 'revisada', 'assinada');--> statement-breakpoint
CREATE TYPE "public"."tipo_ficha" AS ENUM('extensao_cilios', 'estetica_corporal', 'ozonioterapia', 'terapia_capilar', 'limpeza_pele_masculina', 'limpeza_pele_feminina', 'criolipolise', 'massoterapia', 'depilacao', 'plano_tratamento', 'contrato_prestacao_servicos');--> statement-breakpoint
CREATE TABLE "ficha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid,
	"tipo" "tipo_ficha" NOT NULL,
	"status" "status_ficha" DEFAULT 'preenchida' NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"versao_anterior_id" uuid,
	"respostas" jsonb NOT NULL,
	"aceite_termos_em" timestamp,
	"autorizacao_imagem_em" timestamp,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_versao_anterior_id_ficha_id_fk" FOREIGN KEY ("versao_anterior_id") REFERENCES "public"."ficha"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;