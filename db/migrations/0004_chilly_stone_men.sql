CREATE TYPE "public"."situacao_pagamento" AS ENUM('pendente', 'parcial', 'pago');--> statement-breakpoint
CREATE TABLE "pacote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"quantidade_sessoes" integer NOT NULL,
	"data_contratacao" timestamp DEFAULT now() NOT NULL,
	"validade" date,
	"valor_centavos" integer,
	"forma_pagamento" text,
	"situacao_pagamento" "situacao_pagamento" DEFAULT 'pendente' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "pacote_id" uuid;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pacote" ADD CONSTRAINT "pacote_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_pacote_id_pacote_id_fk" FOREIGN KEY ("pacote_id") REFERENCES "public"."pacote"("id") ON DELETE set null ON UPDATE no action;