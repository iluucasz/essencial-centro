CREATE TYPE "public"."tipo_opcao_servico" AS ENUM('grupo', 'periodicidade');--> statement-breakpoint
CREATE TABLE "opcao_servico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_opcao_servico" NOT NULL,
	"nome" text NOT NULL,
	"padrao" boolean DEFAULT false NOT NULL,
	"criado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "opcao_servico" ADD CONSTRAINT "opcao_servico_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "opcao_servico_tipo_nome_unique" ON "opcao_servico" USING btree ("tipo","nome");--> statement-breakpoint
INSERT INTO "opcao_servico" ("tipo", "nome", "padrao") VALUES
	('grupo', 'Massoterapia e terapias', true),
	('grupo', 'Estética corporal', true),
	('grupo', 'Estética facial', true),
	('grupo', 'Saúde integrativa e bem-estar', true),
	('grupo', 'Pré e pós-operatório', true),
	('periodicidade', 'Semanal', true),
	('periodicidade', 'Quinzenal', true),
	('periodicidade', 'Mensal', true),
	('periodicidade', 'Sem periodicidade fixa', true);