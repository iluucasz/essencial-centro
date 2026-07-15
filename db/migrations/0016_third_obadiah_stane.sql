CREATE TABLE "medicamento_informado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"dosagem" text,
	"frequencia" text,
	"profissional_prescritor" text,
	"data_inicio" date,
	"alergia_relacionada" text,
	"alerta_interacao" text,
	"fonte_alerta" text,
	"verificado_por_id" uuid,
	"verificado_em" timestamp,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medicamento_informado" ADD CONSTRAINT "medicamento_informado_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicamento_informado" ADD CONSTRAINT "medicamento_informado_verificado_por_id_usuario_id_fk" FOREIGN KEY ("verificado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicamento_informado" ADD CONSTRAINT "medicamento_informado_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicamento_informado" ADD CONSTRAINT "medicamento_informado_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;