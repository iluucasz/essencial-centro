CREATE TABLE "configuracao_aniversario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"brinde" text,
	"atualizado_por_id" uuid,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envio_aniversario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"ano" integer NOT NULL,
	"enviado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "configuracao_aniversario" ADD CONSTRAINT "configuracao_aniversario_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envio_aniversario" ADD CONSTRAINT "envio_aniversario_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "envio_aniversario_cliente_ano_unique" ON "envio_aniversario" USING btree ("cliente_id","ano");