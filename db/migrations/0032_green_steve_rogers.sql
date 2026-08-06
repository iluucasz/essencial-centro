CREATE TYPE "public"."lado_dor" AS ENUM('direito', 'esquerdo');--> statement-breakpoint
CREATE TYPE "public"."origem_registro_dor" AS ENUM('profissional', 'cliente');--> statement-breakpoint
CREATE TYPE "public"."regiao_dor" AS ENUM('cabeca', 'cervical', 'ombro', 'braco', 'antebraco', 'mao', 'peito', 'abdomen', 'dorsal', 'lombar', 'quadril', 'gluteo', 'coxa', 'joelho', 'panturrilha', 'tornozelo', 'pe');--> statement-breakpoint
CREATE TABLE "registro_dor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"regiao" "regiao_dor" NOT NULL,
	"lado" "lado_dor",
	"intensidade" integer NOT NULL,
	"anterior" boolean NOT NULL,
	"altura_normalizada" double precision NOT NULL,
	"x_normalizado" double precision NOT NULL,
	"observacao" text,
	"origem" "origem_registro_dor" NOT NULL,
	"registrado_em" timestamp DEFAULT now() NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registro_dor" ADD CONSTRAINT "registro_dor_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registro_dor" ADD CONSTRAINT "registro_dor_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;