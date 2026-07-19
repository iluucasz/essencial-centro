ALTER TABLE "codigo_cadastro_biometria" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "codigo_cadastro_biometria" CASCADE;--> statement-breakpoint
ALTER TABLE "biometria_cliente" DROP CONSTRAINT "biometria_cliente_criado_por_id_usuario_id_fk";
--> statement-breakpoint
ALTER TABLE "biometria_cliente" DROP COLUMN "criado_por_id";