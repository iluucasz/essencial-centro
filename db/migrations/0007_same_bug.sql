CREATE TYPE "public"."lado_medida" AS ENUM('direito', 'esquerdo');--> statement-breakpoint
CREATE TYPE "public"."regiao_medida" AS ENUM('abdomen_acima_umbigo', 'linha_umbigo', 'abdomen_abaixo_umbigo', 'quadril', 'gluteo', 'coxa', 'braco');--> statement-breakpoint
CREATE TABLE "medida" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"sessao_id" uuid,
	"regiao" "regiao_medida" NOT NULL,
	"lado" "lado_medida",
	"valor_cm" double precision NOT NULL,
	"data_medicao" timestamp DEFAULT now() NOT NULL,
	"criado_por_id" uuid NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medida" ADD CONSTRAINT "medida_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medida" ADD CONSTRAINT "medida_sessao_id_sessao_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medida" ADD CONSTRAINT "medida_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;