import type { LucideIcon } from "lucide-react";
import { Sparkles, Waves, Wind, HandHeart, Flower2, Leaf, Footprints } from "lucide-react";

export type Service = {
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: LucideIcon;
  treatments: string[];
  catalogs?: { title: string; image: string }[];
};

export const CLINIC = {
  name: "Essencial Centro",
  tagline: "Estética, saúde e bem-estar",
  phone: "+55 21 99253-1805",
  whatsapp: "5521992531805",
  email: "edvania.crespo@gmail.com",
  address: "Rua Marcial, 80, Presidente Juscelino, Mesquita RJ, 26550-800, Brasil",
  instagram: "@essencial.centro",
} as const;

/** Destinos clicáveis dos contatos — externos abrem em nova aba. */
export const CLINIC_LINKS = {
  address: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC.address)}`,
  phone: `https://wa.me/${CLINIC.whatsapp}`,
  instagram: `https://www.instagram.com/${CLINIC.instagram.replace(/^@/, "")}/`,
  email: `mailto:${CLINIC.email}`,
} as const;

export const NAV_LINKS = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Como funciona", href: "/#jornada" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Contato", href: "/#contato" },
] as const;

/** Catálogo público fornecido pela Essencial em setembro de 2026. */
export const SERVICES: Service[] = [
  {
    slug: "estetica-corporal",
    name: "Estética corporal",
    short: "Seu corpo, seu cuidado",
    description:
      "Protocolos personalizados para contorno corporal, textura e firmeza da pele, definidos a partir da sua avaliação.",
    icon: Waves,
    treatments: [
      "Redução de gordura e remodelamento corporal",
      "Tratamento para celulite",
      "Redução de flacidez",
      "Tratamento para estrias",
      "Tonificação muscular",
      "Clareamento de manchas nas áreas íntimas",
      "Drenagem linfática",
    ],
    catalogs: [
      {
        title: "Remodelamento corporal",
        image: "/images/32486ae6-dcba-4703-94a8-28e45c19cb23.jpg",
      },
      { title: "Estrias e tonificação", image: "/images/6857581b-ea62-4006-9105-3424227da70b.jpg" },
      { title: "Drenagem e flacidez", image: "/images/ddd7b5f2-f451-43f2-bb28-e2fd0d410980.jpg" },
    ],
  },
  {
    slug: "estetica-facial",
    name: "Estética facial",
    short: "Realce a sua beleza natural",
    description:
      "Um olhar atento às necessidades da sua pele, com cuidados para hidratação, textura e rejuvenescimento.",
    icon: Sparkles,
    treatments: [
      "Rejuvenescimento facial com skinbooster",
      "Microagulhamento",
      "Tratamento para melasma",
      "Limpeza de pele: acneica, com marcas de acne, oleosa ou ressecada",
      "Hidratação profunda",
      "Rejuvenescimento de pálpebras",
      "Redução de papada",
      "Drenagem linfática facial",
      "Extração de miliuns",
    ],
    catalogs: [
      {
        title: "Limpeza e cuidados com a pele",
        image: "/images/a314997c-81ec-454f-9c60-fc55e1ff24d7.jpg",
      },
      {
        title: "Estética facial avançada",
        image: "/images/c971fd0a-1e1c-48ef-9486-30d4a78f39d7.jpg",
      },
    ],
  },
  {
    slug: "terapia-ortomolecular",
    name: "Terapia ortomolecular",
    short: "Atenção ao seu bem-estar",
    description:
      "Atendimento individualizado para conversar sobre hábitos, alimentação e necessidades de cuidado. Indicações e encaminhamentos são definidos na avaliação profissional.",
    icon: Leaf,
    treatments: [
      "Avaliação de hábitos e necessidades nutricionais",
      "Orientação sobre suplementação",
      "Consulta sobre avaliação por biorressonância",
      "Acompanhamento voltado ao bem-estar",
    ],
  },
  {
    slug: "terapias-integrativas",
    name: "Terapias integrativas",
    short: "Cuidado que acolhe você por inteiro",
    description:
      "Conheça as opções de cuidado complementar da Essencial. A escolha de cada recurso considera seu histórico, suas necessidades e a avaliação profissional.",
    icon: Wind,
    treatments: ["Ozonioterapia", "Laserterapia e ILIB", "Auriculoterapia"],
  },
  {
    slug: "massoterapia",
    name: "Massoterapia",
    short: "Permita-se esse momento",
    description:
      "Uma pausa na rotina para cuidar de você, com massagens e técnicas escolhidas conforme a sua avaliação.",
    icon: HandHeart,
    treatments: [
      "Massagem terapêutica",
      "Massagem relaxante",
      "Pedras quentes",
      "Aromaterapia",
      "Ventosaterapia",
    ],
    catalogs: [
      { title: "Massagens e bem-estar", image: "/images/0bded8a0-f0ab-4817-801e-f9c8c9e9dc68.jpg" },
    ],
  },
  {
    slug: "nutricao",
    name: "Nutrição",
    short: "Alimentação e cuidado no dia a dia",
    description:
      "Atendimento com nutricionista. Converse com a equipe para conhecer a consulta e combinar seu horário.",
    icon: Flower2,
    treatments: ["Consulta com nutricionista", "Orientação alimentar individualizada"],
  },
  {
    slug: "podologia",
    name: "Podologia",
    short: "Carinho em cada passo",
    description:
      "Cuidados com os pés a partir de uma avaliação individual. Fale com a equipe para saber mais sobre o atendimento.",
    icon: Footprints,
    treatments: ["Avaliação dos pés", "Cuidados podológicos"],
  },
];

/** Link do WhatsApp com mensagem pronta. `whatsapp` vem do contato editável (só dígitos, com DDI). */
export function criarLinkAvaliacao(servico?: string, whatsapp: string = CLINIC.whatsapp) {
  const mensagem = servico
    ? "Olá! Gostaria de agendar uma avaliação de " + servico + " na Essencial Centro."
    : "Olá! Gostaria de agendar uma avaliação na Essencial Centro.";
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export const JOURNEY_STEPS = [
  {
    number: "01",
    title: "Avaliação inicial",
    description:
      "Começamos ouvindo você: seus objetivos, sua rotina e seu histórico ajudam a orientar o cuidado.",
  },
  {
    number: "02",
    title: "Plano de tratamento",
    description:
      "A partir da avaliação, conversamos sobre as opções e construímos um plano que faça sentido para você.",
  },
  {
    number: "03",
    title: "Acompanhamento por sessão",
    description:
      "Acompanhamos como você se sente e a resposta ao cuidado para ajustar cada etapa quando necessário.",
  },
  {
    number: "04",
    title: "Resultados e evolução",
    description:
      "No seu portal, consulte os registros e as orientações disponibilizados pela profissional.",
  },
];

export const DIFFERENTIALS = [
  {
    title: "Escuta e acolhimento",
    description: "Tempo para entender o que você precisa e tirar suas dúvidas.",
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

/**
 * Profissional responsável, assinada na seção "Sobre". Nome e título confirmados pelo cliente —
 * numa clínica isso é informação pública sobre pessoa real, então não preencher por suposição.
 */
export const RESPONSAVEL = {
  nome: "Edvania Crespo",
  titulo: "Terapeuta Ortomolecular e Ozonioterapeuta",
} as const;

export const FAQ = [
  {
    question: "Não sei qual tratamento escolher. Por onde começo?",
    answer:
      "Comece por uma avaliação. Vamos conversar sobre o que você procura, seu histórico e suas necessidades para apresentar as opções de cuidado e esclarecer suas dúvidas.",
  },
  {
    question: "Como consulto valores e agendo meu atendimento?",
    answer:
      "Escolha uma categoria no catálogo e fale com a equipe pelo WhatsApp. Algumas categorias também têm páginas do catálogo com valores. A equipe confirma o orçamento, a disponibilidade e o horário antes do atendimento.",
  },
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
