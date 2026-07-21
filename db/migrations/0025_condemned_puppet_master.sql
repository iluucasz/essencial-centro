CREATE TABLE "plano_pacote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"servico_id" uuid NOT NULL,
	"nome" text,
	"quantidade_sessoes" integer NOT NULL,
	"valor_centavos" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plano_pacote" ADD CONSTRAINT "plano_pacote_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plano_pacote" ADD CONSTRAINT "plano_pacote_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plano_pacote" ADD CONSTRAINT "plano_pacote_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico" DROP COLUMN "periodicidade";