import { tool, type Tool } from "ai";
import { z } from "zod";

import { listarAgendamentosDoDia } from "@/modules/agenda/queries";
import { ErroAutorizacao } from "@/modules/auth/rbac";
import { listarClientes } from "@/modules/clientes/queries";
import { listarDocumentosDoCliente } from "@/modules/documentos/queries";
import { obterResumoEvolucaoCliente } from "@/modules/evolucao/queries";
import { listarLancamentos } from "@/modules/financeiro/queries";
import { calcularResumoFinanceiro } from "@/modules/financeiro/resumo";
import { listarMedicamentosDoCliente } from "@/modules/medicamentos/queries";
import { listarPacotesDoCliente } from "@/modules/pacotes/queries";
import { obterRelatorioPeriodo } from "@/modules/relatorios/queries";
import { listarSessoesDoCliente } from "@/modules/sessoes/queries";
import { listarProdutos } from "@/modules/estoque/queries";
import { agoraBrasilia, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/utils";

import { LIMITE_RESULTADOS_BUSCA_CLIENTE, LIMITE_SESSOES_RETORNADAS } from "./config";
import {
  limitarLista,
  reshapeAgendamento,
  reshapeCliente,
  reshapeDocumento,
  reshapeLancamento,
  reshapeMedicamento,
  reshapePacote,
  reshapeProduto,
  reshapeResumoEvolucao,
  reshapeSessao,
  serializarDatas,
} from "./reshape";
import { buscarClientesInputSchema } from "./tool-schemas";

const dataAAAAMMDDSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.")
  .describe("Data no formato AAAA-MM-DD.");

/**
 * z.coerce.date() não é serializável em JSON Schema (erro "Date cannot be represented in JSON
 * Schema" ao montar a definição da ferramenta pro modelo) — por isso as ferramentas recebem data
 * como string e convertem aqui.
 */
function parseDataAAAAMMDD(valor: string): Date {
  return new Date(`${valor}T00:00:00.000`);
}

export function erroFerramenta(erro: unknown) {
  if (erro instanceof ErroAutorizacao) {
    return { erro: "Não autorizado a consultar esse dado." };
  }

  console.error("Erro numa ferramenta do assistente:", erro);

  return { erro: "Não foi possível consultar esse dado agora." };
}

const buscarClientesTool = tool({
  description:
    "Busca clientes cadastrados pelo nome ou e-mail para descobrir o clienteId antes de chamar " +
    "qualquer outra ferramenta que peça um cliente. Sempre use esta ferramenta primeiro quando o " +
    "usuário mencionar um cliente pelo nome — nunca invente um ID.",
  inputSchema: buscarClientesInputSchema,
  execute: async ({ busca }) => {
    try {
      const clientes = await listarClientes(busca);
      const limitados = limitarLista(clientes, LIMITE_RESULTADOS_BUSCA_CLIENTE);

      return { encontrados: limitados.length, clientes: limitados.map(reshapeCliente) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const resumoEvolucaoClienteTool = tool({
  description:
    "Resumo consolidado da evolução do tratamento de um cliente: total de sessões, evolução da " +
    "dor, evolução de medidas corporais, quantidade/data da última foto e pacotes ativos. Use " +
    "para perguntas gerais de progresso — para o conteúdo detalhado de cada sessão, use " +
    "sessoes_do_cliente.",
  inputSchema: z.object({
    clienteId: z.string().uuid().describe("ID obtido via buscar_clientes."),
  }),
  execute: async ({ clienteId }) => {
    try {
      return reshapeResumoEvolucao(await obterResumoEvolucaoCliente(clienteId));
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const medicamentosDoClienteTool = tool({
  description:
    "Retorna os medicamentos já registrados manualmente pela profissional para este cliente " +
    "(nome, dosagem, frequência, prescritor, alergia, alerta de interação já preenchido " +
    "manualmente, status de verificação). NUNCA use para sugerir, calcular ou avaliar interações " +
    "— apenas relate o que já está registrado. Lista vazia significa que nada foi registrado ainda.",
  inputSchema: z.object({ clienteId: z.string().uuid() }),
  execute: async ({ clienteId }) => {
    try {
      const medicamentos = await listarMedicamentosDoCliente(clienteId);

      return { medicamentos: medicamentos.map(reshapeMedicamento) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const lancamentosFinanceirosTool = tool({
  description:
    "Lista lançamentos financeiros (receitas/despesas) da clínica em um período — não é " +
    "vinculado a um cliente específico. Se a profissional não especificar datas, use o mês atual.",
  inputSchema: z.object({
    inicio: dataAAAAMMDDSchema.optional().describe("Início do período, AAAA-MM-DD."),
    fim: dataAAAAMMDDSchema.optional().describe("Fim do período, AAAA-MM-DD."),
  }),
  execute: async ({ inicio, fim }) => {
    try {
      const hoje = agoraBrasilia();
      const periodo = {
        inicio: inicio ? parseDataAAAAMMDD(inicio) : primeiroDiaDoMes(hoje),
        fim: fim ? parseDataAAAAMMDD(fim) : ultimoDiaDoMes(hoje),
      };
      const lancamentos = await listarLancamentos({ periodo });

      return {
        resumo: calcularResumoFinanceiro(lancamentos),
        lancamentos: limitarLista(lancamentos, 30).map(reshapeLancamento),
        totalNoPeriodo: lancamentos.length,
      };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const produtosEstoqueTool = tool({
  description:
    "Lista produtos do estoque com quantidade disponível já calculada e aviso de estoque baixo. " +
    "Use apenasEstoqueBaixo para focar só no que precisa de atenção.",
  inputSchema: z.object({ apenasEstoqueBaixo: z.boolean().optional().default(false) }),
  execute: async ({ apenasEstoqueBaixo }) => {
    try {
      const produtos = await listarProdutos();
      const filtrados = apenasEstoqueBaixo ? produtos.filter((p) => p.avisoEstoqueBaixo) : produtos;

      return { produtos: filtrados.map(reshapeProduto) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const agendamentosDoDiaTool = tool({
  description:
    "Lista os agendamentos de um dia específico: horário, cliente, serviço, status, modalidade. " +
    "Para 'hoje', use a data de hoje informada no prompt do sistema.",
  inputSchema: z.object({ data: dataAAAAMMDDSchema }),
  execute: async ({ data }) => {
    try {
      const agendamentos = await listarAgendamentosDoDia(parseDataAAAAMMDD(data));

      return { agendamentos: agendamentos.map(reshapeAgendamento) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const pacotesDoClienteTool = tool({
  description:
    "Lista os pacotes de sessões contratados por um cliente com progresso " +
    "(realizadas/restantes), validade e situação de pagamento.",
  inputSchema: z.object({ clienteId: z.string().uuid() }),
  execute: async ({ clienteId }) => {
    try {
      const pacotes = await listarPacotesDoCliente(clienteId);

      return { pacotes: pacotes.map(reshapePacote) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const documentosDoClienteTool = tool({
  description:
    "Lista documentos (contratos, termos, orientações) emitidos para um cliente: tipo, título, " +
    "status (emitido/assinado), datas, e um resumo do conteúdo. Nunca inclui a assinatura, IP ou " +
    "dispositivo usado — só metadados do documento.",
  inputSchema: z.object({ clienteId: z.string().uuid() }),
  execute: async ({ clienteId }) => {
    try {
      const documentos = await listarDocumentosDoCliente(clienteId);

      return { documentos: documentos.map(reshapeDocumento) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const relatorioPeriodoTool = tool({
  description:
    "Relatório agregado da clínica em um período: financeiro, agendamentos por status, taxa de " +
    "comparecimento, ranking de serviços, novos clientes. Visão geral do negócio, não de um " +
    "cliente específico. Peça um período se a profissional não especificar (padrão: mês atual).",
  inputSchema: z.object({
    inicio: dataAAAAMMDDSchema.optional(),
    fim: dataAAAAMMDDSchema.optional(),
  }),
  execute: async ({ inicio, fim }) => {
    try {
      const hoje = agoraBrasilia();
      const relatorio = await obterRelatorioPeriodo(
        inicio ? parseDataAAAAMMDD(inicio) : primeiroDiaDoMes(hoje),
        fim ? parseDataAAAAMMDD(fim) : ultimoDiaDoMes(hoje),
      );

      return { ...relatorio, rankingServicos: limitarLista(relatorio.rankingServicos, 5) };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

const sessoesDoClienteTool = tool({
  description:
    "Retorna as sessões clínicas mais recentes de um cliente (relato do cliente, avaliação da " +
    "profissional, orientações, escala de dor). É o dado mais sensível do sistema — use só " +
    "quando a pergunta exigir o conteúdo detalhado de sessões específicas; para progresso geral " +
    "prefira resumo_evolucao_cliente. NUNCA use este conteúdo para sugerir tratamento, medicação " +
    "ou qualquer decisão clínica — apenas relate o que já foi registrado.",
  inputSchema: z.object({
    clienteId: z.string().uuid(),
    limite: z
      .number()
      .int()
      .min(1)
      .max(LIMITE_SESSOES_RETORNADAS)
      .optional()
      .describe(`Quantas sessões recentes trazer (máximo ${LIMITE_SESSOES_RETORNADAS}).`),
  }),
  execute: async ({ clienteId, limite }) => {
    try {
      const sessoes = await listarSessoesDoCliente(clienteId);
      const limitadas = limitarLista(sessoes, limite ?? LIMITE_SESSOES_RETORNADAS);

      return {
        totalDisponivel: sessoes.length,
        sessoesRetornadas: limitadas.length,
        sessoes: limitadas.map(reshapeSessao),
      };
    } catch (erro) {
      return erroFerramenta(erro);
    }
  },
});

/**
 * Envolve o `execute` de cada ferramenta para serializar datas (ver serializarDatas) num único
 * ponto — impossível esquecer uma ferramenta e cobre automaticamente as futuras.
 */
function comDatasSerializadas<T extends Record<string, Tool>>(ferramentas: T): T {
  const entradas = Object.entries(ferramentas).map(([nome, ferramenta]) => {
    const execOriginal = ferramenta.execute;

    if (typeof execOriginal !== "function") return [nome, ferramenta] as const;

    const execute: typeof execOriginal = (input, options) =>
      Promise.resolve(execOriginal(input, options)).then(serializarDatas);

    return [nome, { ...ferramenta, execute }] as const;
  });

  return Object.fromEntries(entradas) as T;
}

export const ferramentasAssistente = comDatasSerializadas({
  buscar_clientes: buscarClientesTool,
  resumo_evolucao_cliente: resumoEvolucaoClienteTool,
  medicamentos_do_cliente: medicamentosDoClienteTool,
  lancamentos_financeiros: lancamentosFinanceirosTool,
  produtos_estoque: produtosEstoqueTool,
  agendamentos_do_dia: agendamentosDoDiaTool,
  pacotes_do_cliente: pacotesDoClienteTool,
  documentos_do_cliente: documentosDoClienteTool,
  relatorio_periodo: relatorioPeriodoTool,
  sessoes_do_cliente: sessoesDoClienteTool,
});
