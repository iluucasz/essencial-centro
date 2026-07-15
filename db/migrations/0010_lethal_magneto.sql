CREATE TYPE "public"."situacao_lancamento" AS ENUM('pendente', 'pago', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_lancamento" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TABLE "lancamento_financeiro" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_lancamento" NOT NULL,
	"categoria" text NOT NULL,
	"descricao" text,
	"valor_centavos" integer NOT NULL,
	"data" date NOT NULL,
	"forma_pagamento" text,
	"situacao" "situacao_lancamento" DEFAULT 'pendente' NOT NULL,
	"cliente_id" uuid,
	"pacote_id" uuid,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_pacote_id_pacote_id_fk" FOREIGN KEY ("pacote_id") REFERENCES "public"."pacote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamento_financeiro" ADD CONSTRAINT "lancamento_financeiro_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;