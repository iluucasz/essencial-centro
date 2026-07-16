CREATE TYPE "public"."dedo_biometria" AS ENUM('polegar', 'indicador', 'medio');--> statement-breakpoint
CREATE TYPE "public"."resultado_tentativa_biometrica" AS ENUM('confirmado', 'ja_confirmado', 'rejeitado_far', 'rejeitado_qualidade', 'rejeitado_ambiguo', 'rejeitado_invalido', 'sem_match');--> statement-breakpoint
CREATE TABLE "biometria_cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"dedo" "dedo_biometria" NOT NULL,
	"template_base64" text NOT NULL,
	"template_hash" text NOT NULL,
	"qualidade_captura" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "codigo_cadastro_biometria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"dedo" "dedo_biometria" NOT NULL,
	"codigo" text NOT NULL,
	"expira_em" timestamp NOT NULL,
	"consumido_em" timestamp,
	"biometria_gerada_id" uuid,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tentativa_identificacao_biometrica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biometria_id_reportada" uuid,
	"cliente_id" uuid,
	"agendamento_id" uuid,
	"resultado" "resultado_tentativa_biometrica" NOT NULL,
	"far_atingido" double precision,
	"far_segundo_colocado" double precision,
	"qualidade" integer,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cliente" ADD COLUMN "consentimento_biometria" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cliente" ADD COLUMN "consentimento_biometria_em" timestamp;--> statement-breakpoint
ALTER TABLE "biometria_cliente" ADD CONSTRAINT "biometria_cliente_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometria_cliente" ADD CONSTRAINT "biometria_cliente_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biometria_cliente" ADD CONSTRAINT "biometria_cliente_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codigo_cadastro_biometria" ADD CONSTRAINT "codigo_cadastro_biometria_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codigo_cadastro_biometria" ADD CONSTRAINT "codigo_cadastro_biometria_biometria_gerada_id_biometria_cliente_id_fk" FOREIGN KEY ("biometria_gerada_id") REFERENCES "public"."biometria_cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codigo_cadastro_biometria" ADD CONSTRAINT "codigo_cadastro_biometria_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tentativa_identificacao_biometrica" ADD CONSTRAINT "tentativa_identificacao_biometrica_biometria_id_reportada_biometria_cliente_id_fk" FOREIGN KEY ("biometria_id_reportada") REFERENCES "public"."biometria_cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tentativa_identificacao_biometrica" ADD CONSTRAINT "tentativa_identificacao_biometrica_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tentativa_identificacao_biometrica" ADD CONSTRAINT "tentativa_identificacao_biometrica_agendamento_id_agendamento_id_fk" FOREIGN KEY ("agendamento_id") REFERENCES "public"."agendamento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "biometria_cliente_ativo_unique" ON "biometria_cliente" USING btree ("cliente_id","dedo") WHERE "biometria_cliente"."ativo" = true;