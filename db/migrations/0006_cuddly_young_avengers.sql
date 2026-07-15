CREATE TABLE "sessao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"servico_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"agendamento_id" uuid,
	"pacote_id" uuid,
	"data_hora" timestamp DEFAULT now() NOT NULL,
	"duracao_minutos" integer,
	"regiao_tratada" text,
	"condicao_antes" text,
	"relato_cliente" text,
	"escala_dor_antes" integer,
	"escala_dor_depois" integer,
	"avaliacao_profissional" text,
	"equipamentos_utilizados" text,
	"parametros_utilizados" text,
	"produtos_aplicados" text,
	"reacoes_observadas" text,
	"observacoes_internas" text,
	"orientacoes_pos_atendimento" text,
	"proxima_sessao_recomendada" date,
	"presenca_confirmada" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_servico_id_servico_id_fk" FOREIGN KEY ("servico_id") REFERENCES "public"."servico"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_profissional_id_usuario_id_fk" FOREIGN KEY ("profissional_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_pacote_id_pacote_id_fk" FOREIGN KEY ("pacote_id") REFERENCES "public"."pacote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;