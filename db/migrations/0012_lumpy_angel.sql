CREATE TYPE "public"."status_documento" AS ENUM('emitido', 'assinado');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('contrato_prestacao_servicos', 'termo_responsabilidade', 'termo_autorizacao_imagem', 'orientacao', 'outro');--> statement-breakpoint
CREATE TABLE "documento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" "tipo_documento" NOT NULL,
	"titulo" text NOT NULL,
	"conteudo" text NOT NULL,
	"status" "status_documento" DEFAULT 'emitido' NOT NULL,
	"assinado_em" timestamp,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documento" ADD CONSTRAINT "documento_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento" ADD CONSTRAINT "documento_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento" ADD CONSTRAINT "documento_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;