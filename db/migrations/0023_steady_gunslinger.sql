CREATE TYPE "public"."frequencia_recorrencia" AS ENUM('semanal', 'mensal');--> statement-breakpoint
CREATE TABLE "serie_agendamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"pacote_id" uuid NOT NULL,
	"frequencia" "frequencia_recorrencia" NOT NULL,
	"dia_semana" integer,
	"dia_do_mes" integer,
	"hora" integer NOT NULL,
	"minuto" integer NOT NULL,
	"duracao_minutos" integer NOT NULL,
	"modalidade" text DEFAULT 'presencial' NOT NULL,
	"data_inicio" timestamp NOT NULL,
	"quantidade" integer NOT NULL,
	"observacoes" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agendamento" ADD COLUMN "serie_id" uuid;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_profissional_id_usuario_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_pacote_id_pacote_id_fk" FOREIGN KEY ("pacote_id") REFERENCES "public"."pacote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_agendamento" ADD CONSTRAINT "serie_agendamento_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_serie_id_serie_agendamento_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."serie_agendamento"("id") ON DELETE set null ON UPDATE no action;