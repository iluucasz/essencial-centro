CREATE TYPE "public"."destinatarios_campanha" AS ENUM('todos', 'selecionados');--> statement-breakpoint
CREATE TYPE "public"."status_envio_campanha" AS ENUM('enviado', 'falhou');--> statement-breakpoint
CREATE TABLE "campanha_mensagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conteudo" text NOT NULL,
	"mensagem_predefinida_id" uuid,
	"destinatarios" "destinatarios_campanha" NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envio_campanha_mensagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campanha_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"status" "status_envio_campanha" NOT NULL,
	"erro" text,
	"enviado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensagem_predefinida" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"conteudo" text NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campanha_mensagem" ADD CONSTRAINT "campanha_mensagem_mensagem_predefinida_id_mensagem_predefinida_id_fk" FOREIGN KEY ("mensagem_predefinida_id") REFERENCES "public"."mensagem_predefinida"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanha_mensagem" ADD CONSTRAINT "campanha_mensagem_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envio_campanha_mensagem" ADD CONSTRAINT "envio_campanha_mensagem_campanha_id_campanha_mensagem_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanha_mensagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envio_campanha_mensagem" ADD CONSTRAINT "envio_campanha_mensagem_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagem_predefinida" ADD CONSTRAINT "mensagem_predefinida_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;