CREATE TYPE "public"."estado_conexao_whatsapp" AS ENUM('connected', 'connecting', 'disconnected', 'unknown');--> statement-breakpoint
CREATE TABLE "conexao_whatsapp" (
	"chave" text PRIMARY KEY DEFAULT 'clinica' NOT NULL,
	"instance_name" text NOT NULL,
	"instance_created_at" timestamp NOT NULL,
	"connection_state" "estado_conexao_whatsapp" NOT NULL,
	"connected_number" text,
	"connected_name" text,
	"connection_checked_at" timestamp
);
