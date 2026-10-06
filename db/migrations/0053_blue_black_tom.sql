CREATE TYPE "public"."status_convite_cadastro" AS ENUM('pendente', 'concluido');--> statement-breakpoint
CREATE TABLE "convite_cadastro_cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telefone" text NOT NULL,
	"token" text NOT NULL,
	"token_expira_em" timestamp NOT NULL,
	"status" "status_convite_cadastro" DEFAULT 'pendente' NOT NULL,
	"cliente_id" uuid,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"concluido_em" timestamp,
	CONSTRAINT "convite_cadastro_cliente_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "convite_cadastro_cliente" ADD CONSTRAINT "convite_cadastro_cliente_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convite_cadastro_cliente" ADD CONSTRAINT "convite_cadastro_cliente_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;