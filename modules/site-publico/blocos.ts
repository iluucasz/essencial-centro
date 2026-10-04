import { z } from "zod";
import {
  CLINIC,
  DIFFERENTIALS,
  FAQ,
  JOURNEY_STEPS,
  RESPONSAVEL,
  SERVICES,
} from "@/lib/marketing/clinic";
import { nomeDoIcone, nomesIcone } from "./icones";
import { midiaPublicaPermitida } from "./validacao";

/**
 * Textos editáveis das seções fixas do site. Cada bloco tem um formato validado e um padrão —
 * o texto que o site já tinha. O banco (`bloco_site`) guarda só o que foi editado; bloco sem
 * registro, ou com registro inválido, cai no padrão, então o site nunca fica sem texto.
 */

const texto = (max: number) => z.string().trim().min(1, "Preencha este campo.").max(max);
const textoOpcional = (max: number) => z.string().trim().max(max).default("");

export const blocoInicioSchema = z.object({
  selo: texto(80),
  tituloLinha1: texto(60),
  tituloLinha2: texto(60),
  chamada: texto(200),
  paragrafo: texto(600),
  botaoPrincipal: texto(40),
  botaoSecundario: texto(40),
  rodape: textoOpcional(140),
});

export const blocoFaixaSchema = z.object({
  palavras: z.array(texto(40)).min(1, "Mantenha ao menos uma palavra.").max(6),
});

const paginaCatalogoSchema = z.object({
  titulo: texto(80),
  imagem: z.string().trim().refine(midiaPublicaPermitida, "Envie a imagem por esta tela."),
});

const categoriaCatalogoSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(60),
  nome: texto(60),
  chamada: textoOpcional(80),
  descricao: texto(600),
  icone: z.enum(nomesIcone),
  tratamentos: z.array(texto(160)).max(20),
  paginas: z.array(paginaCatalogoSchema).max(12),
});

export const blocoCatalogoSchema = z.object({
  selo: texto(60),
  titulo: texto(160),
  subtitulo: textoOpcional(240),
  aviso: textoOpcional(240),
  categorias: z
    .array(categoriaCatalogoSchema)
    .min(1, "Mantenha ao menos uma categoria.")
    .max(15)
    .refine(
      (categorias) =>
        new Set(categorias.map((categoria) => categoria.slug)).size === categorias.length,
      "Há duas categorias com o mesmo nome.",
    ),
});

const imagemSchema = z
  .string()
  .trim()
  .refine(midiaPublicaPermitida, "Envie a imagem por esta tela.");

/** Cabeçalho padrão de seção: selo pequeno, título e texto de apoio. */
export const cabecalhoSchema = z.object({
  selo: texto(60),
  titulo: texto(160),
  texto: textoOpcional(600),
});

export const blocoJornadaSchema = cabecalhoSchema.extend({
  passos: z
    .array(z.object({ titulo: texto(80), descricao: texto(300) }))
    .min(1, "Mantenha ao menos um passo.")
    .max(6),
  imagem: imagemSchema,
  descricaoImagem: texto(160),
  diferenciais: z
    .array(z.object({ titulo: texto(60), descricao: texto(240), icone: z.enum(nomesIcone) }))
    .max(6),
});

export const blocoSobreSchema = cabecalhoSchema.extend({
  destaques: z.array(texto(120)).max(8),
  imagem: imagemSchema,
  nomeResponsavel: textoOpcional(80),
  cargoResponsavel: textoOpcional(120),
});

const cartaoLoginSchema = z.object({
  selo: texto(60),
  titulo: texto(60),
  descricao: texto(300),
  recursos: z.array(texto(40)).max(6),
  botao: texto(40),
});

export const blocoLoginSchema = cabecalhoSchema.extend({
  profissional: cartaoLoginSchema,
  cliente: cartaoLoginSchema,
});

export const blocoDuvidasSchema = z.object({
  selo: texto(60),
  titulo: texto(160),
  perguntas: z
    .array(z.object({ pergunta: texto(200), resposta: texto(1200) }))
    .min(1, "Mantenha ao menos uma pergunta.")
    .max(20),
});

export const blocoContatoSchema = cabecalhoSchema.extend({
  endereco: texto(200),
  horario: texto(160),
  telefone: z
    .string()
    .trim()
    .refine((valor) => /^\+?[\d\s()-]{10,20}$/.test(valor), "Informe um telefone com DDD."),
  instagram: textoOpcional(60),
  email: z.union([z.literal(""), z.email("Informe um e-mail válido.")]).default(""),
  imagem: z.union([z.literal(""), imagemSchema]).default(""),
  descricaoImagem: textoOpcional(160),
  cartaoTitulo: texto(80),
  cartaoTexto: texto(400),
  pergunta: texto(80),
  botao: texto(40),
  observacao: textoOpcional(300),
});

export const blocoRodapeSchema = z.object({
  descricao: texto(300),
  aviso: textoOpcional(160),
});

export type BlocoCabecalho = z.infer<typeof cabecalhoSchema>;
export type BlocoJornada = z.infer<typeof blocoJornadaSchema>;
export type BlocoSobre = z.infer<typeof blocoSobreSchema>;
export type BlocoLogin = z.infer<typeof blocoLoginSchema>;
export type BlocoDuvidas = z.infer<typeof blocoDuvidasSchema>;
export type BlocoContato = z.infer<typeof blocoContatoSchema>;
export type BlocoRodape = z.infer<typeof blocoRodapeSchema>;

export type BlocoInicio = z.infer<typeof blocoInicioSchema>;
export type BlocoFaixa = z.infer<typeof blocoFaixaSchema>;
export type BlocoCatalogo = z.infer<typeof blocoCatalogoSchema>;
export type CategoriaCatalogo = BlocoCatalogo["categorias"][number];

export const blocoInicioPadrao: BlocoInicio = {
  selo: "Saúde · Beleza · Bem-estar",
  tituloLinha1: "Sua beleza,",
  tituloLinha2: "nosso cuidado.",
  chamada: "Um tempo para você. Um cuidado com a sua essência.",
  paragrafo:
    "Na Essencial Centro, em Mesquita, estética, massoterapia e bem-estar se encontram em um atendimento feito para acolher sua história e valorizar quem você é.",
  botaoPrincipal: "Agendar minha avaliação",
  botaoSecundario: "Conhecer os cuidados",
  rodape: "Atendimento individualizado, com técnica e carinho.",
};

export const blocoFaixaPadrao: BlocoFaixa = {
  palavras: ["Autoestima", "Bem-estar", "Qualidade de vida"],
};

export const blocoCatalogoPadrao: BlocoCatalogo = {
  selo: "Nosso catálogo",
  titulo: "Muitas formas de cuidar.\nUma só essência: você.",
  subtitulo: "Da estética ao bem-estar, encontre um cuidado para o seu momento.",
  aviso:
    "Cada pessoa tem uma história. A indicação dos procedimentos depende de avaliação individual.",
  categorias: SERVICES.map((servico) => ({
    slug: servico.slug,
    nome: servico.name,
    chamada: servico.short,
    descricao: servico.description,
    icone: nomeDoIcone(servico.icon),
    tratamentos: servico.treatments,
    paginas: (servico.catalogs ?? []).map((pagina) => ({
      titulo: pagina.title,
      imagem: pagina.image,
    })),
  })),
};

export const blocoJornadaPadrao: BlocoJornada = {
  selo: "Como funciona",
  titulo: "Um cuidado que começa na escuta e segue com você",
  texto:
    "Você não precisa chegar sabendo qual procedimento escolher. Nossa equipe ajuda a entender as possibilidades e acompanha cada etapa do seu cuidado.",
  passos: JOURNEY_STEPS.map((passo) => ({ titulo: passo.title, descricao: passo.description })),
  imagem: "/profissionais_modelos/prof_2.png",
  descricaoImagem: "Ana Carolina, podóloga do Essencial Centro",
  diferenciais: DIFFERENTIALS.map((item) => ({
    titulo: item.title,
    descricao: item.description,
    icone: nomeDoIcone(item.icon),
  })),
};

export const blocoSobrePadrao: BlocoSobre = {
  selo: "Sobre a clínica",
  titulo: "Cuidado essencial, com técnica e carinho",
  texto:
    "Na Essencial Centro de Massoterapia e Estética, cuidar de você é a nossa missão. Em Mesquita, reunimos cuidados com o corpo, a pele e o bem-estar em um espaço de escuta e acolhimento. Cada atendimento começa com a sua história e respeita o seu momento.",
  destaques: [
    "Atendimento individualizado e humanizado",
    "Protocolos baseados em avaliação criteriosa",
    "Registro fotográfico e de medidas com consentimento",
    "Ambiente acolhedor e higienizado",
  ],
  imagem: "/profissionais_modelos/prof_3.png",
  nomeResponsavel: RESPONSAVEL.nome,
  cargoResponsavel: RESPONSAVEL.titulo,
};

export const blocoProfissionaisPadrao: BlocoCabecalho = {
  selo: "Nossos profissionais",
  titulo: "Conheça quem cuida de você.",
  texto: "Dedicação, escuta e conhecimento para acolher você em cada etapa.",
};

export const blocoDepoimentosPadrao: BlocoCabecalho = {
  selo: "Depoimentos",
  titulo: "Quem se cuida aqui, conta.",
  texto: "Experiências reais de quem já passou pela Essencial.",
};

export const blocoLoginPadrao: BlocoLogin = {
  selo: "Login",
  titulo: "Um portal para cada necessidade",
  texto: "Acesso seguro e separado por perfil, com as permissões adequadas para cada pessoa.",
  profissional: {
    selo: "Para a profissional",
    titulo: "Painel de gestão",
    descricao:
      "Gerencie clientes, agenda, fichas de anamnese, medidas, fotografias e a evolução de cada tratamento.",
    recursos: ["Prontuário digital", "Agenda e sessões", "Fichas inteligentes"],
    botao: "Fazer login",
  },
  cliente: {
    selo: "Para o cliente",
    titulo: "Meu tratamento",
    descricao:
      "Acompanhe próximas sessões, evolução de medidas, orientações e documentos autorizados, com privacidade.",
    recursos: ["Minha evolução", "Documentos e termos", "Próximas sessões"],
    botao: "Fazer login",
  },
};

export const blocoDuvidasPadrao: BlocoDuvidas = {
  selo: "Dúvidas frequentes",
  titulo: "Privacidade e transparência",
  perguntas: FAQ.map((item) => ({ pergunta: item.question, resposta: item.answer })),
};

export const blocoContatoPadrao: BlocoContato = {
  selo: "Contato",
  titulo: "Agende sua avaliação",
  texto:
    "Vamos encontrar um cuidado para o seu momento? Converse com a equipe pelo WhatsApp e combine sua avaliação.",
  endereco: CLINIC.address,
  horario: "Horário de atendimento a combinar",
  telefone: CLINIC.phone,
  instagram: CLINIC.instagram,
  email: CLINIC.email,
  imagem: "/profissionais_modelos/dr_edmo.png",
  descricaoImagem: "Dr. Edmo de Souza, terapeuta ortomolecular do Essencial Centro",
  cartaoTitulo: "Seu primeiro passo começa aqui.",
  cartaoTexto:
    "Escolha uma área de interesse. Vamos abrir uma conversa com a Essencial para você tirar dúvidas sobre os cuidados, valores e horários.",
  pergunta: "Qual cuidado você procura?",
  botao: "Continuar no WhatsApp",
  observacao:
    "Você poderá revisar e enviar a mensagem no WhatsApp. O agendamento será confirmado pela equipe durante a conversa.",
};

export const blocoRodapePadrao: BlocoRodape = {
  descricao: `${CLINIC.tagline}. Sua beleza, nosso cuidado. Em Mesquita, um espaço para cuidar da sua autoestima e do seu bem-estar.`,
  aviso: "Dados sensíveis tratados conforme a LGPD.",
};

/** Número só com dígitos e DDI, como o WhatsApp espera em `wa.me/<número>`. */
export function numeroWhatsapp(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

/** Destinos clicáveis dos contatos editados (mapa, WhatsApp, Instagram, e-mail). */
export function linksContato(contato: BlocoContato) {
  const usuario = contato.instagram.replace(/^@/, "").trim();
  return {
    endereco: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contato.endereco)}`,
    whatsapp: `https://wa.me/${numeroWhatsapp(contato.telefone)}`,
    instagram: usuario ? `https://www.instagram.com/${usuario}/` : "",
    email: contato.email ? `mailto:${contato.email}` : "",
  };
}

/** Capa usada pelas categorias que ainda não têm arte própria no catálogo. */
export const capaCatalogoPadrao = "/images/31e915c7-2250-45ac-ac13-c73cd776a142.jpg";

export const blocosSite = {
  inicio: { rotulo: "Seção inicial", schema: blocoInicioSchema, padrao: blocoInicioPadrao },
  faixa: { rotulo: "Faixa", schema: blocoFaixaSchema, padrao: blocoFaixaPadrao },
  catalogo: { rotulo: "Catálogo", schema: blocoCatalogoSchema, padrao: blocoCatalogoPadrao },
  jornada: { rotulo: "Como funciona", schema: blocoJornadaSchema, padrao: blocoJornadaPadrao },
  sobre: { rotulo: "Sobre", schema: blocoSobreSchema, padrao: blocoSobrePadrao },
  profissionais: {
    rotulo: "Profissionais",
    schema: cabecalhoSchema,
    padrao: blocoProfissionaisPadrao,
  },
  depoimentos: { rotulo: "Depoimentos", schema: cabecalhoSchema, padrao: blocoDepoimentosPadrao },
  login: { rotulo: "Login", schema: blocoLoginSchema, padrao: blocoLoginPadrao },
  duvidas: { rotulo: "Dúvidas frequentes", schema: blocoDuvidasSchema, padrao: blocoDuvidasPadrao },
  contato: { rotulo: "Contato", schema: blocoContatoSchema, padrao: blocoContatoPadrao },
  rodape: { rotulo: "Rodapé", schema: blocoRodapeSchema, padrao: blocoRodapePadrao },
} as const;

export type ChaveBloco = keyof typeof blocosSite;
export const chavesBloco = Object.keys(blocosSite) as [ChaveBloco, ...ChaveBloco[]];
export type BlocosSite = { [Chave in ChaveBloco]: (typeof blocosSite)[Chave]["padrao"] };

export function blocosPadrao(): BlocosSite {
  return Object.fromEntries(
    chavesBloco.map((chave) => [chave, blocosSite[chave].padrao]),
  ) as BlocosSite;
}

/** Transforma o nome digitado num identificador estável (usado como chave da categoria). */
export function gerarSlug(nome: string) {
  return (
    nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "categoria"
  );
}

const nomesCampo: Record<string, string> = {
  selo: "Selo",
  tituloLinha1: "Título (1ª linha)",
  tituloLinha2: "Título (2ª linha)",
  chamada: "Chamada",
  paragrafo: "Parágrafo",
  botaoPrincipal: "Botão principal",
  botaoSecundario: "Botão secundário",
  rodape: "Frase final",
  palavras: "Palavra",
  titulo: "Título",
  subtitulo: "Subtítulo",
  aviso: "Aviso",
  categorias: "Categoria",
  nome: "Nome",
  descricao: "Descrição",
  icone: "Ícone",
  tratamentos: "Tratamento",
  paginas: "Arte",
  imagem: "Imagem",
  texto: "Texto",
  passos: "Passo",
  descricaoImagem: "Descrição da imagem",
  diferenciais: "Diferencial",
  destaques: "Destaque",
  nomeResponsavel: "Nome da responsável",
  cargoResponsavel: "Cargo da responsável",
  profissional: "Cartão da profissional",
  cliente: "Cartão do cliente",
  recursos: "Recurso",
  botao: "Botão",
  perguntas: "Pergunta",
  pergunta: "Pergunta",
  resposta: "Resposta",
  endereco: "Endereço",
  horario: "Horário",
  telefone: "Telefone",
  instagram: "Instagram",
  email: "E-mail",
  cartaoTitulo: "Título do cartão",
  cartaoTexto: "Texto do cartão",
  observacao: "Observação",
};

/** Mensagem de validação dizendo onde está o problema — ex.: "Categoria 3 › Nome: Preencha…". */
export function descreverErroBloco(erro: z.ZodError) {
  const problema = erro.issues[0];
  const caminho: string[] = [];
  problema.path.forEach((parte, posicao) => {
    if (typeof parte === "number") {
      const anterior = caminho.pop() ?? "";
      caminho.push(`${anterior} ${parte + 1}`.trim());
    } else if (posicao < problema.path.length)
      caminho.push(nomesCampo[String(parte)] ?? String(parte));
  });
  return caminho.length ? `${caminho.join(" › ")}: ${problema.message}` : problema.message;
}
