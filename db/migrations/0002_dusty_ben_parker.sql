CREATE TYPE "public"."grupo_servico" AS ENUM('massoterapia', 'estetica_corporal', 'estetica_facial', 'saude_integrativa', 'pre_pos_operatorio');--> statement-breakpoint
CREATE TABLE "servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"grupo" "grupo_servico" NOT NULL,
	"descricao" text,
	"indicacao" text,
	"contraindicacoes" text,
	"duracao_minutos" integer NOT NULL,
	"periodicidade" text,
	"valor_centavos" integer,
	"preparo" text,
	"cuidados_posteriores" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "servico" ADD CONSTRAINT "servico_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servico" ADD CONSTRAINT "servico_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;