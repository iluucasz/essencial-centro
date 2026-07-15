CREATE TYPE "public"."tipo_notificacao" AS ENUM('agendamento_criado', 'sessao_concluida', 'pacote_acabando', 'geral');--> statement-breakpoint
CREATE TABLE "notificacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destinatario_id" uuid NOT NULL,
	"tipo" "tipo_notificacao" NOT NULL,
	"titulo" text NOT NULL,
	"mensagem" text NOT NULL,
	"link" text,
	"lida" boolean DEFAULT false NOT NULL,
	"lida_em" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_destinatario_id_usuario_id_fk" FOREIGN KEY ("destinatario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;