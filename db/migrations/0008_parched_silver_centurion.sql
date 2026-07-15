CREATE TABLE "foto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"sessao_id" uuid,
	"regiao" text NOT NULL,
	"pathname" text NOT NULL,
	"content_type" text NOT NULL,
	"tamanho_bytes" integer,
	"data_foto" timestamp DEFAULT now() NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_sessao_id_sessao_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto" ADD CONSTRAINT "foto_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;