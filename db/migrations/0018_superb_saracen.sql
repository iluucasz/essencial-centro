CREATE TYPE "public"."papel_mensagem_assistente" AS ENUM('usuario', 'assistente');--> statement-breakpoint
CREATE TABLE "mensagem_assistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profissional_id" uuid NOT NULL,
	"papel" "papel_mensagem_assistente" NOT NULL,
	"conteudo" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensagem_assistente" ADD CONSTRAINT "mensagem_assistente_profissional_id_usuario_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mensagem_assistente_profissional_criado_idx" ON "mensagem_assistente" USING btree ("profissional_id","criado_em");