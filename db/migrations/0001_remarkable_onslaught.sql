CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"data_nascimento" date NOT NULL,
	"telefone" text,
	"email" text,
	"endereco" text,
	"contato_emergencia_nome" text,
	"contato_emergencia_telefone" text,
	"profissao" text,
	"objetivo_tratamento" text,
	"alergias" text,
	"medicamentos" text,
	"condicoes_saude" text,
	"cirurgias" text,
	"contraindicacoes" text,
	"consentimento_dados" boolean DEFAULT false NOT NULL,
	"consentimento_imagem" boolean DEFAULT false NOT NULL,
	"observacoes_internas" text,
	"criado_por_id" uuid NOT NULL,
	"atualizado_por_id" uuid,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_criado_por_id_usuario_id_fk" FOREIGN KEY ("criado_por_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_atualizado_por_id_usuario_id_fk" FOREIGN KEY ("atualizado_por_id") REFERENCES "public"."usuario"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cliente_email_unique" ON "cliente" USING btree ("email");