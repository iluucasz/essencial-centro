import type { LucideIcon } from "lucide-react";
import { Sparkles, Waves, Wind, Scissors, Eye, Snowflake, HandHeart, Flower2 } from "lucide-react";

export type Service = {
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: LucideIcon;
  duration: string;
  category: "Corporal" | "Facial" | "Terapias" | "Beleza";
};

export const CLINIC = {
  name: "Essencial Centro",
  tagline: "Estética, saúde e bem-estar",
  phone: "(11) 91234-5678",
  whatsapp: "5511912345678",
  email: "contato@essencialcentro.com.br",
  address: "Rua das Palmeiras, 210 — Jardim Botânico, São Paulo",
  instagram: "@essencialcentro",
} as const;

export const NAV_LINKS = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Como funciona", href: "/#jornada" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Contato", href: "/#contato" },
] as const;

export const SERVICES: Service[] = [
  {
    slug: "estetica-corporal",
    name: "Estética Corporal",
    short: "Redução de medidas e firmeza",
    description:
      "Protocolos para gordura localizada, celulite, flacidez e retenção com acompanhamento de medidas por sessão.",
    icon: Waves,
    duration: "60 min",
    category: "Corporal",
  },
  {
    slug: "limpeza-de-pele",
    name: "Limpeza de Pele",
    short: "Facial feminina e masculina",
    description:
      "Avaliação de fototipo, oleosidade, acne e textura, com limpeza profunda e cuidado personalizado.",
    icon: Sparkles,
    duration: "50 min",
    category: "Facial",
  },
  {
    slug: "massoterapia",
    name: "Massoterapia",
    short: "Alívio de dores e tensões",
    description:
      "Massagens terapêuticas e relaxantes com mapeamento da dor e evolução registrada a cada atendimento.",
    icon: HandHeart,
    duration: "60 min",
    category: "Terapias",
  },
  {
    slug: "ozonioterapia",
    name: "Ozonioterapia",
    short: "Terapia integrativa",
    description:
      "Protocolo com histórico clínico detalhado por sistemas do corpo e controle de até 15 sessões.",
    icon: Wind,
    duration: "40 min",
    category: "Terapias",
  },
  {
    slug: "terapia-capilar",
    name: "Terapia Capilar",
    short: "Saúde do couro cabeludo",
    description:
      "Avaliação de cabelo e couro cabeludo, hábitos e tratamentos anteriores para um plano sob medida.",
    icon: Scissors,
    duration: "45 min",
    category: "Terapias",
  },
  {
    slug: "extensao-de-cilios",
    name: "Extensão de Cílios",
    short: "Olhar marcante e natural",
    description:
      "Anamnese ocular completa, avaliação de alergias e aplicação segura com termo de responsabilidade.",
    icon: Eye,
    duration: "90 min",
    category: "Beleza",
  },
  {
    slug: "criolipolise",
    name: "Criolipólise",
    short: "Congelamento de gordura",
    description:
      "Avaliação de contraindicações, medidas corporais e autorização específica de imagens.",
    icon: Snowflake,
    duration: "60 min",
    category: "Corporal",
  },
  {
    slug: "depilacao",
    name: "Depilação",
    short: "Pele lisa e cuidada",
    description: "Histórico de técnicas, reações e alergias avaliados antes de cada procedimento.",
    icon: Flower2,
    duration: "30 min",
    category: "Beleza",
  },
];

export const JOURNEY_STEPS = [
  {
    number: "01",
    title: "Avaliação inicial",
    description:
      "Você preenche a anamnese digital antes da consulta. Dados pessoais são reaproveitados em todas as fichas.",
  },
  {
    number: "02",
    title: "Plano de tratamento",
    description:
      "A profissional define o protocolo, registra medidas, fotografias e as orientações liberadas para você.",
  },
  {
    number: "03",
    title: "Acompanhamento por sessão",
    description:
      "Cada atendimento registra evolução, medidas e escala de dor, tudo vinculado ao seu prontuário.",
  },
  {
    number: "04",
    title: "Resultados e evolução",
    description:
      "Acompanhe gráficos de medidas, comparativos de antes e depois autorizados e seus documentos assinados.",
  },
];

export const DIFFERENTIALS = [
  {
    title: "Fichas digitais inteligentes",
    description:
      "Formulários que reagem às respostas: campos aparecem só quando são necessários, sem paredão de perguntas.",
    icon: Sparkles,
  },
  {
    title: "Evolução em gráficos",
    description:
      "Medidas corporais, dores e sintomas registrados por sessão e apresentados em tabelas e comparativos.",
    icon: Waves,
  },
  {
    title: "Privacidade e LGPD",
    description:
      "Dados de saúde e imagens tratados como dados sensíveis, com consentimentos separados e acesso controlado.",
    icon: HandHeart,
  },
];

export const FAQ = [
  {
    question: "Meus dados de saúde ficam protegidos?",
    answer:
      "Sim. Dados de saúde, fotografias e medidas são considerados sensíveis pela LGPD. Utilizamos controle de acesso, registro de atividades e consentimentos específicos para cada finalidade.",
  },
  {
    question: "Preciso autorizar o uso das minhas fotos?",
    answer:
      "A autorização de imagem é separada do termo de atendimento. Você pode realizar o tratamento sem autorizar qualquer publicação em redes sociais.",
  },
  {
    question: "Consigo acompanhar minha evolução?",
    answer:
      "No portal do cliente você vê próximas sessões, medidas, escala de dor, comparativos de antes e depois autorizados e documentos assinados.",
  },
  {
    question: "Como funcionam as fichas de anamnese?",
    answer:
      "São formulários digitais por serviço. Você preenche as partes liberadas, confirma informações e assina termos. A profissional complementa a avaliação técnica.",
  },
];
