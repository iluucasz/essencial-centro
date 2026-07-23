import type { AudienciaCampo, CampoModelo } from "./campos";

/**
 * Semente dos modelos de ficha, transcritos das fichas em papel (`fichas/*.docx`). Dados pessoais
 * (nome, telefone, endereço…) NÃO se repetem aqui — são reaproveitados do cadastro do cliente
 * (docs/context/07-fichas.md). São inseridos por `scripts/seed-modelos-ficha.ts` só quando o slug
 * ainda não existe (a profissional pode editá-los depois sem perder as mudanças ao re-semear).
 */
export type ModeloSemente = {
  slug: string;
  nome: string;
  descricao: string;
  campos: CampoModelo[];
};

type Opcoes = { obrig?: boolean; detalhe?: boolean; prof?: boolean; ajuda?: string };

function quem(o: Opcoes): AudienciaCampo {
  return o.prof ? "profissional" : "cliente";
}

const secao = (id: string, rotulo: string): CampoModelo => ({
  id,
  tipo: "secao",
  rotulo,
  obrigatorio: false,
  quemPreenche: "cliente",
});

const texto = (id: string, rotulo: string, o: Opcoes = {}): CampoModelo => ({
  id,
  tipo: "texto_curto",
  rotulo,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
  ...(o.ajuda ? { ajuda: o.ajuda } : {}),
});

const textoLongo = (id: string, rotulo: string, o: Opcoes = {}): CampoModelo => ({
  id,
  tipo: "texto_longo",
  rotulo,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
  ...(o.ajuda ? { ajuda: o.ajuda } : {}),
});

const numero = (id: string, rotulo: string, o: Opcoes = {}): CampoModelo => ({
  id,
  tipo: "numero",
  rotulo,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
});

const data = (id: string, rotulo: string, o: Opcoes = {}): CampoModelo => ({
  id,
  tipo: "data",
  rotulo,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
});

const simNao = (id: string, rotulo: string, o: Opcoes = {}): CampoModelo => ({
  id,
  tipo: "sim_nao",
  rotulo,
  obrigatorio: Boolean(o.obrig),
  detalheSeSim: Boolean(o.detalhe),
  quemPreenche: quem(o),
});

const selecaoUnica = (
  id: string,
  rotulo: string,
  opcoes: string[],
  o: Opcoes = {},
): CampoModelo => ({
  id,
  tipo: "selecao_unica",
  rotulo,
  opcoes,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
});

const selecaoMultipla = (
  id: string,
  rotulo: string,
  opcoes: string[],
  o: Opcoes = {},
): CampoModelo => ({
  id,
  tipo: "selecao_multipla",
  rotulo,
  opcoes,
  obrigatorio: Boolean(o.obrig),
  quemPreenche: quem(o),
});

const aceiteVeracidade = (id = "aceite_veracidade"): CampoModelo => ({
  id,
  tipo: "aceite",
  rotulo: "Declaro que as informações prestadas são verdadeiras.",
  obrigatorio: true,
  quemPreenche: "cliente",
});

/** Histórico clínico compartilhado pelas fichas da família "massagem/estética corporal". */
function historicoClinicoBase(): CampoModelo[] {
  return [
    secao("hist", "Histórico do cliente"),
    simNao("acompanhamento_medico", "Faz acompanhamento médico?", { detalhe: true }),
    simNao("usa_medicacao", "Usa medicação?", { detalhe: true }),
    simNao("doenca_cronica", "Possui alguma doença crônica?", { detalhe: true }),
    simNao("gestante", "Está gestante?", {
      detalhe: true,
      ajuda: "Se sim, informe quantas semanas.",
    }),
    simNao("cirurgia", "Já realizou alguma cirurgia?", { detalhe: true }),
    simNao("fluxo_menstrual_alto", "Menstruação com fluxo alto?"),
    simNao("inflamacao_aguda", "Possui inflamação aguda?"),
    simNao("varizes", "Possui varizes?"),
    simNao("mioma", "Mioma?"),
    simNao("fratura_recente", "Alguma fratura recente?"),
    simNao("antecedentes_oncologicos", "Possui antecedentes oncológicos?", { detalhe: true }),
    simNao("intestino_regular", "Funcionamento intestinal regular?"),
    selecaoMultipla("problemas_tipo", "Possui problemas do tipo", [
      "Cardiovascular",
      "Ginecológico",
      "Alérgico",
      "Traumatológico",
    ]),
  ];
}

const alergiasComuns = ["Iodo", "Cânfora", "Enxofre", "Menta", "Ovo"];
const habitosAlimentares = [
  "Frutas",
  "Legumes",
  "Frituras",
  "Fibras",
  "Verduras",
  "Peixe",
  "Carne vermelha",
  "Doce",
  "Bebida alcoólica",
  "Fuma",
];
const doencasLimpezaPele = [
  "Asma",
  "Usa corticoide",
  "Convulsão",
  "Enxaqueca",
  "Marca-passo",
  "Bronquite",
  "Diabético",
  "Hipertensão",
  "Pressão baixa",
  "Varizes",
  "Problema renal",
  "Prótese dental",
  "Depressão",
  "Trombose",
];

function limpezaPeleBase(): CampoModelo[] {
  return [
    secao("id_ctx", "Identificação e queixa"),
    textoLongo("queixa", "Queixa principal", { obrig: true }),
    texto("indicacao", "Indicação"),
    secao("alim", "Hábitos alimentares"),
    selecaoMultipla("habitos_alimentares", "Hábitos alimentares", habitosAlimentares),
    selecaoUnica("agua_dia", "Água ingerida por dia", [
      "1 copo (250 ml)",
      "2 copos",
      "3 copos",
      "4 ou mais",
      "Nenhum",
    ]),
    secao("aler", "Alergias"),
    selecaoMultipla("alergias", "Alergia a", alergiasComuns),
    simNao("alergia_cosmeticos", "Alergia a cosméticos?", { detalhe: true }),
    texto("cosmeticos_uso", "Cosméticos em uso"),
    secao("doen", "Doenças"),
    selecaoMultipla("doencas", "Doenças", doencasLimpezaPele),
    simNao("usa_medicamentos", "Faz uso regular de medicamentos?", { detalhe: true }),
    simNao("cirurgia_plastica", "Cirurgia plástica?", { detalhe: true }),
  ];
}

export const modelosSemente: ModeloSemente[] = [
  {
    slug: "estetica-corporal",
    nome: "Anamnese — Estética corporal",
    descricao: "Massagem modeladora, redução de medidas, flacidez e celulite.",
    campos: [
      secao("obj", "Objetivo do tratamento"),
      selecaoMultipla("procedimento", "Procedimento", [
        "Massagem modeladora",
        "Combo de estrias",
        "Combo de flacidez",
        "Redução de medidas",
        "Combo de celulite",
      ]),
      textoLongo("objetivo", "Qual é o seu objetivo?", { obrig: true }),
      simNao("ja_fez_massagem", "Já fez massagem antes?"),
      numero("peso_kg", "Peso (kg)"),
      numero("altura_cm", "Altura (cm)"),
      ...historicoClinicoBase(),
      secao("aval", "Avaliação da profissional"),
      textoLongo("diagnostico", "Diagnóstico estético", { prof: true }),
      textoLongo("procedimentos_indicados", "Procedimentos indicados", { prof: true }),
      simNao("contraindicacao", "Contraindicação importante?", { detalhe: true, prof: true }),
      textoLongo("observacoes_internas", "Observações internas", { prof: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "massoterapia",
    nome: "Anamnese — Massoterapia",
    descricao: "Massagem terapêutica, relaxante ou modeladora.",
    campos: [
      secao("dados_massagem", "Dados da massagem"),
      selecaoUnica("tipo_massagem", "Tipo de massagem", [
        "Terapêutica",
        "Estética / modeladora",
        "Relaxante",
      ]),
      textoLongo("objetivo", "Qual é o seu objetivo?", { obrig: true }),
      simNao("ja_fez_massagem", "Já fez massagem antes?"),
      ...historicoClinicoBase(),
      secao("aval", "Avaliação da profissional"),
      textoLongo("observacoes_internas", "Observações internas", { prof: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "criolipolise",
    nome: "Anamnese — Criolipólise",
    descricao: "Histórico clínico, contraindicações e autorização de imagens.",
    campos: [
      secao("obj", "Objetivo"),
      textoLongo("objetivo", "Qual é o seu objetivo?", { obrig: true }),
      simNao("ja_fez_massagem", "Já fez procedimento antes?"),
      ...historicoClinicoBase(),
      simNao("hernia", "Possui hérnia na região a tratar?", { detalhe: true }),
      secao("aval", "Avaliação da profissional"),
      textoLongo("regioes_indicadas", "Regiões indicadas", { prof: true }),
      simNao("contraindicacao", "Contraindicação importante?", { detalhe: true, prof: true }),
      simNao("autoriza_imagens", "Autorizo o uso das minhas imagens (antes/depois)."),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "extensao-cilios",
    nome: "Anamnese — Extensão de cílios",
    descricao: "Histórico ocular, alergias e termo de responsabilidade.",
    campos: [
      secao("hist", "Histórico do cliente"),
      textoLongo("objetivo", "Objetivo do procedimento", { obrig: true }),
      simNao("ja_fez", "Já fez extensão de cílios?"),
      simNao("usa_lentes", "Usa lentes de contato?"),
      simNao("alergia_cosmetico", "Possui alergia a cosmético ou maquiagem?", { detalhe: true }),
      simNao("alergia_higiene", "Possui alergia a produtos de higiene pessoal?", { detalhe: true }),
      simNao("gestante", "Está gestante?", { detalhe: true }),
      simNao("lactante", "Está lactante?"),
      simNao("cirurgia_ocular", "Sofreu alguma cirurgia (inclusive ocular)?", { detalhe: true }),
      simNao("doenca_ocular", "Possui alguma doença ocular?", { detalhe: true }),
      simNao("tratamento_dermatologico", "Está fazendo tratamentos dermatológicos?", {
        detalhe: true,
      }),
      secao("aval", "Avaliação da profissional"),
      texto("tecnica", "Técnica aplicada", { prof: true }),
      texto("curvatura_espessura", "Curvatura e espessura dos fios", { prof: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "depilacao",
    nome: "Anamnese — Depilação",
    descricao: "Técnica usada, reações, alergias e histórico.",
    campos: [
      secao("hist", "Histórico do cliente"),
      simNao("costuma_depilar", "Costuma fazer depilação?"),
      selecaoUnica("tecnica", "Qual técnica usada?", [
        "Cera quente",
        "Cera fria",
        "Roll-on",
        "Laser",
        "Linha (egípcia)",
      ]),
      selecaoMultipla("alergias", "Antecedentes alérgicos", [
        "Creme",
        "Pré-depilatório",
        "Pós-depilatório",
        "Cera",
      ]),
      selecaoMultipla("reacao_pele", "Como a pele se apresentou após a depilação", [
        "Vermelhidão",
        "Inchaço",
        "Coceira",
        "Escamação",
      ]),
      simNao("varizes", "Vasos ou varizes?"),
      simNao("nodulos", "Tem nódulos?", { detalhe: true }),
      simNao("gravida", "Está grávida?", { detalhe: true }),
      simNao("amamenta", "Amamenta?"),
      simNao("cirurgia", "Sofreu alguma cirurgia?", { detalhe: true }),
      simNao("problema_hormonal", "Tem problema hormonal?", { detalhe: true }),
      simNao("tratamento_dermatologico", "Está fazendo tratamentos dermatológicos?", {
        detalhe: true,
      }),
      simNao("pelos_encravados", "Tem pelos encravados?", { detalhe: true }),
      simNao("lesao_area", "Apresenta lesão na área a ser depilada?", { detalhe: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "terapia-capilar",
    nome: "Anamnese — Terapia capilar",
    descricao: "Afecções, alimentação, hábitos e cosméticos.",
    campos: [
      secao("id_ctx", "Identificação e queixa"),
      textoLongo("queixa", "Queixa principal", { obrig: true }),
      secao("afeccoes", "Afecções sistêmicas"),
      selecaoMultipla("afeccoes", "Afecções", [
        "Coração",
        "Epilepsia",
        "Antecedentes cancerígenos",
        "Gestante",
        "Diabetes",
        "Hipertensão",
        "Hipotensão",
        "Alergia",
        "Alergia cosmética",
        "Prótese metálica",
        "Depressão",
        "Stress",
        "Tireoide",
      ]),
      simNao("usa_medicacao", "Faz uso de medicação?", { detalhe: true }),
      secao("alim", "Alimentação"),
      selecaoMultipla("alimentacao", "Consome", ["Frutas", "Verduras", "Carnes"]),
      numero("copos_agua", "Copos de água por dia"),
      secao("habitos", "Hábitos cotidianos"),
      selecaoMultipla("habitos", "Hábitos", [
        "Usa boné",
        "Prende molhado",
        "Lava à noite",
        "Seca sempre",
        "Molha sempre",
        "Usa elástico",
        "Usa leave-in / creme de pentear",
      ]),
      texto("shampoo", "Shampoo em uso"),
      secao("aval", "Avaliação da profissional"),
      textoLongo("caracteristicas", "Características de cabelo/couro cabeludo", { prof: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "limpeza-pele-feminina",
    nome: "Anamnese — Limpeza de pele feminina",
    descricao: "Hábitos, alergias, doenças e histórico hormonal.",
    campos: [
      ...limpezaPeleBase(),
      secao("horm", "Histórico hormonal"),
      data("ultima_menstruacao", "Última menstruação"),
      simNao("anticoncepcional", "Usa anticoncepcional?", { detalhe: true }),
      simNao("diu", "Usa DIU?"),
      simNao("gestacoes", "Já teve gestações?", { detalhe: true }),
      simNao("problemas_parto", "Problemas pós/pré-parto?", { detalhe: true }),
      secao("aval", "Avaliação da profissional"),
      textoLongo("avaliacao_facial", "Avaliação facial (fototipo, acne, textura, oleosidade)", {
        prof: true,
      }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "limpeza-pele-masculina",
    nome: "Anamnese — Limpeza de pele masculina",
    descricao: "Hábitos, alergias, doenças e cuidados com a barba.",
    campos: [
      ...limpezaPeleBase(),
      secao("barba", "Barba"),
      simNao("tem_barba", "Tem barba?"),
      simNao("tem_bigode", "Tem bigode?"),
      selecaoUnica("metodo_barba", "Como faz a barba", ["Navalha", "Cera", "Prestobarba"]),
      simNao("alergia_pos_barba", "Alergia no pós-barba?", { detalhe: true }),
      secao("aval", "Avaliação da profissional"),
      textoLongo("avaliacao_facial", "Avaliação facial (fototipo, acne, textura, oleosidade)", {
        prof: true,
      }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "ozonioterapia",
    nome: "Anamnese — Ozonioterapia",
    descricao: "Histórico clínico por sistemas e contraindicações.",
    campos: [
      secao("geral", "Saúde geral"),
      textoLongo("queixa", "Qual é a sua queixa?", { obrig: true }),
      simNao("boa_saude", "Tem boa saúde geral?"),
      simNao("mudanca_saude", "Apresentou alguma mudança na saúde no último ano?", {
        detalhe: true,
      }),
      data("ultima_consulta", "Data da última consulta médica"),
      simNao("doenca_grave_cirurgia", "Já sofreu doença grave com intervenção cirúrgica?", {
        detalhe: true,
        ajuda: "Cirurgia, mês/ano, tipo de anestesia.",
      }),
      simNao("hospitalizado", "Foi hospitalizado nos últimos 5 anos?", { detalhe: true }),
      secao("cardio", "Sistema cardiovascular"),
      selecaoMultipla("cardiovascular", "Já teve/tem", [
        "Problemas de coração",
        "Trombose ou embolia",
        "Ataques cardíacos",
        "Insuficiência coronária",
        "Lesões de válvulas cardíacas",
        "Cardiopatias congênitas",
      ]),
      simNao("dor_peito", "Dor no peito após esforço físico?"),
      simNao("falta_ar", "Falta de ar após exercício leve?"),
      simNao("pernas_incham", "Suas pernas incham?"),
      simNao("pressao_arterial", "Tem problema de pressão arterial?", { detalhe: true }),
      simNao("usa_marcapasso", "Usa marca-passo?"),
      secao("outros", "Outras condições"),
      simNao("diabetes", "Diabetes?", { detalhe: true }),
      simNao("alergias", "Possui alergias?", { detalhe: true }),
      simNao("gestante", "Está gestante?", { detalhe: true }),
      secao("aval", "Avaliação da profissional"),
      textoLongo("protocolo", "Protocolo indicado", { prof: true }),
      aceiteVeracidade(),
    ],
  },
  {
    slug: "plano-tratamento",
    nome: "Plano de tratamento",
    descricao: "Registro por sessão: data e descrição do que foi feito.",
    campos: [
      secao("plano", "Plano de tratamento"),
      textoLongo("objetivo_geral", "Objetivo geral do tratamento", { prof: true }),
      data("sessao1_data", "1ª sessão — data", { prof: true }),
      textoLongo("sessao1_desc", "1ª sessão — descrição", { prof: true }),
      data("sessao2_data", "2ª sessão — data", { prof: true }),
      textoLongo("sessao2_desc", "2ª sessão — descrição", { prof: true }),
      data("sessao3_data", "3ª sessão — data", { prof: true }),
      textoLongo("sessao3_desc", "3ª sessão — descrição", { prof: true }),
      data("sessao4_data", "4ª sessão — data", { prof: true }),
      textoLongo("sessao4_desc", "4ª sessão — descrição", { prof: true }),
    ],
  },
  {
    slug: "contrato-prestacao-servicos",
    nome: "Contrato de prestação de serviços",
    descricao: "Cuidados, efeitos possíveis, regras financeiras e aceite.",
    campos: [
      secao("intro", "Contrato de prestação de serviço"),
      {
        id: "intro_texto",
        tipo: "paragrafo",
        rotulo:
          "Você deu um importante passo para a melhora da sua saúde e bem-estar. Para o melhor resultado, precisamos do seu comprometimento e dedicação.",
        obrigatorio: false,
        quemPreenche: "cliente",
      },
      secao("cuidados", "Cuidados e efeitos possíveis"),
      {
        id: "cuidados_texto",
        tipo: "paragrafo",
        rotulo:
          "Estética facial: não se expor ao sol por 20 dias após a última sessão; usar filtro solar diariamente. Estética corporal: alguns procedimentos podem causar inchaço, dor ou manchas roxas temporárias no local — é um efeito colateral normal.",
        obrigatorio: false,
        quemPreenche: "cliente",
      },
      secao("financeiro", "Financeiro"),
      {
        id: "financeiro_texto",
        tipo: "paragrafo",
        rotulo:
          "Em caso de desistência não há devolução do valor pago, mas a troca por outro serviço ou a transferência para outra pessoa.",
        obrigatorio: false,
        quemPreenche: "cliente",
      },
      texto("tratamento_contratado", "Tratamento contratado", { prof: true }),
      {
        id: "aceite_contrato",
        tipo: "aceite",
        rotulo: "Li e aceito os termos do contrato de prestação de serviços.",
        obrigatorio: true,
        quemPreenche: "cliente",
      },
    ],
  },
];
