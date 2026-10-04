import { z } from "zod";

export const tiposConteudo = ["destaque", "profissional", "depoimento"] as const;
export type TipoConteudo = (typeof tiposConteudo)[number];

/**
 * Textos de cada seção do site — a mesma tabela `conteudo_site` guarda as três, mas cada uma usa
 * os campos com um sentido diferente (ex.: `titulo` é a legenda no carrossel e o nome do cliente
 * no depoimento). Centralizar aqui evita formulário genérico com rótulo ambíguo.
 */
export const secoesConteudo = {
  destaque: {
    rotulo: "Carrossel da seção inicial",
    item: "foto do carrossel",
    descricao: "Fotos e vídeos que giram ao lado do título, no topo da página inicial.",
    vazio:
      "Nenhuma foto publicada no carrossel. Enquanto isso, o site mostra a foto padrão da clínica.",
    titulo: { rotulo: "Legenda", exemplo: "Ex.: Cuidar de você é a nossa missão." },
    subtitulo: { rotulo: "Linha de apoio", exemplo: "Ex.: Essencial Centro de Massoterapia" },
    texto: null,
    midia: { rotulo: "Foto ou vídeo", obrigatoria: true },
  },
  profissional: {
    rotulo: "Profissionais",
    item: "profissional",
    descricao: "Apresentação de quem atende na clínica, com foto, especialidade e um breve texto.",
    vazio: "Nenhum profissional publicado. A seção “Nossos profissionais” fica oculta no site.",
    titulo: { rotulo: "Nome", exemplo: "Ex.: Edvania Crespo" },
    subtitulo: { rotulo: "Especialidade", exemplo: "Ex.: Terapeuta Ortomolecular" },
    texto: { rotulo: "Apresentação", exemplo: "Formação, experiência e forma de atender." },
    midia: { rotulo: "Foto ou vídeo", obrigatoria: true },
  },
  depoimento: {
    rotulo: "Depoimentos",
    item: "depoimento",
    descricao: "Relatos reais de clientes, com a nota que deram ao atendimento.",
    vazio: "Nenhum depoimento publicado. A seção de depoimentos fica oculta no site.",
    titulo: { rotulo: "Nome do cliente", exemplo: "Ex.: Maria S." },
    subtitulo: { rotulo: "Tratamento", exemplo: "Ex.: Estética corporal" },
    texto: { rotulo: "Depoimento", exemplo: "Escreva o relato exatamente como o cliente contou." },
    midia: { rotulo: "Foto ou vídeo do cliente", obrigatoria: false },
  },
} as const;

export const tiposArquivoSite = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];
export const tiposAudioSite = ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg"];
export const limiteArquivoSite = 100 * 1024 * 1024;

/** Filtros visuais aplicados via CSS na exibição — foto e vídeo originais ficam intactos. */
export const filtrosMidia = {
  original: { rotulo: "Original", css: "none" },
  quente: { rotulo: "Quente", css: "sepia(0.22) saturate(1.2) brightness(1.03)" },
  suave: { rotulo: "Suave", css: "brightness(1.08) contrast(0.9) saturate(0.85)" },
  vivo: { rotulo: "Vivo", css: "saturate(1.35) contrast(1.08)" },
  pb: { rotulo: "Preto e branco", css: "grayscale(1) contrast(1.05)" },
  retro: { rotulo: "Retrô", css: "sepia(0.45) contrast(0.95) brightness(1.05) saturate(0.85)" },
} as const;
export type FiltroMidia = keyof typeof filtrosMidia;
export const nomesFiltro = Object.keys(filtrosMidia) as [FiltroMidia, ...FiltroMidia[]];

export function midiaPublicaPermitida(valor: string) {
  if (
    /^\/(images|profissionais_modelos)\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|mp4|webm)$/.test(valor)
  )
    return true;
  return (
    midiaEnviadaNoSite(valor) && /\.(jpg|jpeg|png|webp|mp4|webm)$/.test(new URL(valor).pathname)
  );
}

/** Arquivo enviado pela tela de conteúdo (Vercel Blob, pasta `site-publico/`) — o único que pode ser apagado. */
export function midiaEnviadaNoSite(valor: string) {
  try {
    const url = new URL(valor);
    return (
      url.protocol === "https:" &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) &&
      /^\/site-publico\/[a-zA-Z0-9_.-]+$/.test(url.pathname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

/** Música de fundo: só áudio enviado pela tela de conteúdo. */
export function musicaPermitida(valor: string) {
  return midiaEnviadaNoSite(valor) && /\.(mp3|m4a|aac|ogg)$/.test(new URL(valor).pathname);
}

export const conteudoSiteSchema = z
  .object({
    id: z.uuid().optional(),
    tipo: z.enum(tiposConteudo),
    titulo: z.string().trim().min(2, "Preencha este campo.").max(120),
    subtitulo: z.string().trim().max(160).default(""),
    texto: z.string().trim().max(2000).default(""),
    tipoMidia: z.enum(["imagem", "video"]).default("imagem"),
    midia: z
      .string()
      .trim()
      .refine(
        (valor) => !valor || midiaPublicaPermitida(valor),
        "Use um arquivo enviado nesta tela.",
      )
      .default(""),
    filtro: z.enum(nomesFiltro).default("original"),
    somOriginal: z.boolean().default(true),
    musica: z
      .string()
      .trim()
      .refine((valor) => !valor || musicaPermitida(valor), "Envie a música por esta tela.")
      .default(""),
    volumeMusica: z.coerce.number().int().min(0).max(100).default(60),
    nota: z.number().int().min(1).max(5).nullable().default(null),
    publicado: z.boolean().default(false),
    autorizacaoPublicacao: z.boolean().default(false),
  })
  .superRefine((dados, contexto) => {
    if (dados.tipo === "depoimento" && dados.publicado && dados.nota === null)
      contexto.addIssue({
        code: "custom",
        path: ["nota"],
        message: "Informe a nota real do cliente, de 1 a 5 estrelas.",
      });
    if (secoesConteudo[dados.tipo].midia.obrigatoria && !dados.midia)
      contexto.addIssue({
        code: "custom",
        path: ["midia"],
        message: "Adicione uma foto ou um vídeo.",
      });
    if (dados.tipo === "depoimento" && dados.texto.length < 10)
      contexto.addIssue({
        code: "custom",
        path: ["texto"],
        message: "Escreva o depoimento do cliente (mínimo de 10 caracteres).",
      });
    if (dados.publicado && !dados.autorizacaoPublicacao)
      contexto.addIssue({
        code: "custom",
        path: ["autorizacaoPublicacao"],
        message: "Confirme a autorização para publicar.",
      });
  });

export type ConteudoSiteInput = z.infer<typeof conteudoSiteSchema>;
export type AjustesMidia = Pick<
  ConteudoSiteInput,
  "filtro" | "somOriginal" | "musica" | "volumeMusica"
>;
export type ConteudoPublico = Pick<
  ConteudoSiteInput,
  "tipo" | "titulo" | "subtitulo" | "texto" | "tipoMidia" | "midia"
> &
  AjustesMidia & { id: string; ordem: number; nota?: number | null };

/** Foto exibida no topo do site só enquanto nenhum destaque foi publicado — o hero nunca fica vazio. */
export const destaquePadrao: ConteudoPublico = {
  id: "destaque-padrao",
  tipo: "destaque",
  titulo: "Cuidar de você é a nossa missão.",
  subtitulo: "Essencial Centro de Massoterapia e Estética",
  texto: "",
  tipoMidia: "imagem",
  midia: "/profissionais_modelos/prof_1.png",
  filtro: "original",
  somOriginal: true,
  musica: "",
  volumeMusica: 60,
  ordem: 0,
};
