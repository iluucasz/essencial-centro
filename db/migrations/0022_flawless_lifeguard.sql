ALTER TABLE "servico" ALTER COLUMN "grupo" SET DATA TYPE text USING (
	CASE "grupo"::text
		WHEN 'massoterapia' THEN 'Massoterapia e terapias'
		WHEN 'estetica_corporal' THEN 'Estética corporal'
		WHEN 'estetica_facial' THEN 'Estética facial'
		WHEN 'saude_integrativa' THEN 'Saúde integrativa e bem-estar'
		WHEN 'pre_pos_operatorio' THEN 'Pré e pós-operatório'
		ELSE "grupo"::text
	END
);--> statement-breakpoint
DROP TYPE "public"."grupo_servico";