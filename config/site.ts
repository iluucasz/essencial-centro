/**
 * Constantes globais do produto. Sem lógica — apenas dados de configuração.
 */
export const site = {
  name: "Essencial Centro",
  tagline:
    "Uma plataforma que transforma cada atendimento em uma jornada visível de cuidado, acompanhamento e evolução.",
  description:
    "Gestão e acompanhamento clínico para estética facial e corporal, massoterapia, estética integrativa e pré/pós-operatório.",
  locale: "pt-BR",
} as const;

/** Papéis de acesso do sistema. Ver docs/context/06-lgpd-seguranca.md */
export const roles = ["profissional", "cliente", "recepcao"] as const;
export type Role = (typeof roles)[number];
