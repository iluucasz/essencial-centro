import "server-only";

import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { cliente } from "@/modules/clientes/schema";
import { medicamentoInformado } from "@/modules/medicamentos/schema";
import { registroDor } from "@/modules/dor/schema";
import { sessao } from "@/modules/sessoes/schema";

import { statusRevisao, type StatusRevisao, type TipoAnalise } from "./analise";
import { analiseClinica } from "./schema";

const colunas = {
  id: analiseClinica.id,
  tipo: analiseClinica.tipo,
  titulo: analiseClinica.titulo,
  arquivoNome: analiseClinica.arquivoNome,
  arquivoPathname: analiseClinica.arquivoPathname,
  analiseIa: analiseClinica.analiseIa,
  modeloIa: analiseClinica.modeloIa,
  observacaoProfissional: analiseClinica.observacaoProfissional,
  revisadoEm: analiseClinica.revisadoEm,
  criadoEm: analiseClinica.criadoEm,
};

export type AnaliseDoCliente = {
  id: string;
  tipo: TipoAnalise;
  titulo: string;
  arquivoNome: string | null;
  temArquivo: boolean;
  analiseIa: string;
  modeloIa: string;
  observacaoProfissional: string | null;
  revisadoEm: Date | null;
  criadoEm: Date;
  status: StatusRevisao;
};

/**
 * Análises de um cliente. Restrito a `profissional`: é raciocínio clínico interno e saída de IA não
 * revisada — nem `recepcao` nem o portal veem isso (`docs/context/06-lgpd-seguranca.md`).
 */
export async function listarAnalisesDoCliente(clienteId: string): Promise<AnaliseDoCliente[]> {
  autorizarPapel(await auth(), ["profissional"]);

  const registros = await db
    .select(colunas)
    .from(analiseClinica)
    .where(eq(analiseClinica.clienteId, clienteId))
    .orderBy(desc(analiseClinica.criadoEm));

  return registros.map(({ arquivoPathname, ...registro }) => ({
    ...registro,
    temArquivo: Boolean(arquivoPathname),
    status: statusRevisao(registro.revisadoEm),
  }));
}

/** Texto de um PDF já importado — permite reanalisar sem pedir o arquivo de novo. */
export async function obterTextoExtraido(id: string, clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [registro] = await db
    .select({ texto: analiseClinica.textoExtraido })
    .from(analiseClinica)
    .where(eq(analiseClinica.id, id))
    .limit(1);

  void clienteId;

  return registro?.texto ?? null;
}

/**
 * Contexto clínico usado pela **recomendação terapêutica**. Monta em texto só o que ajuda a decidir
 * conduta — e nada além: sem endereço, telefone, e-mail, CPF ou documento. É esse texto que sai da
 * aplicação para a Groq, então o filtro aqui é a fronteira de privacidade do módulo.
 */
export async function montarContextoClinico(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [dados] = await db
    .select({
      nome: cliente.nome,
      dataNascimento: cliente.dataNascimento,
      alergias: cliente.alergias,
      medicamentos: cliente.medicamentos,
      condicoesSaude: cliente.condicoesSaude,
      cirurgias: cliente.cirurgias,
      contraindicacoes: cliente.contraindicacoes,
    })
    .from(cliente)
    .where(eq(cliente.id, clienteId))
    .limit(1);

  if (!dados) return null;

  const suplementos = await db
    .select({
      nome: medicamentoInformado.nome,
      dosagem: medicamentoInformado.dosagem,
      frequencia: medicamentoInformado.frequencia,
      alerta: medicamentoInformado.alertaInteracao,
    })
    .from(medicamentoInformado)
    .where(eq(medicamentoInformado.clienteId, clienteId));

  const dores = await db
    .select({
      regiao: registroDor.regiao,
      lado: registroDor.lado,
      intensidade: registroDor.intensidade,
      observacao: registroDor.observacao,
    })
    .from(registroDor)
    .where(eq(registroDor.clienteId, clienteId))
    .orderBy(desc(registroDor.registradoEm))
    .limit(12);

  const sessoes = await db
    .select({
      dataHora: sessao.dataHora,
      // `observacoesInternas` fica FORA de propósito: é anotação interna e não precisa sair da
      // aplicação pra um terceiro só pra propor conduta.
      avaliacaoProfissional: sessao.avaliacaoProfissional,
      relatoCliente: sessao.relatoCliente,
      reacoesObservadas: sessao.reacoesObservadas,
      escalaDorAntes: sessao.escalaDorAntes,
      escalaDorDepois: sessao.escalaDorDepois,
    })
    .from(sessao)
    .where(eq(sessao.clienteId, clienteId))
    .orderBy(desc(sessao.dataHora))
    .limit(5);

  const linhas: string[] = [];

  const idade = dados.dataNascimento
    ? Math.floor((Date.now() - dados.dataNascimento.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  if (idade) linhas.push(`- Idade: ${idade} anos`);

  const campos: [string, string | null][] = [
    ["Alergias", dados.alergias],
    ["Medicamentos em uso (relato da cliente)", dados.medicamentos],
    ["Condições de saúde", dados.condicoesSaude],
    ["Cirurgias", dados.cirurgias],
    ["Contraindicações", dados.contraindicacoes],
  ];
  for (const [rotulo, valor] of campos) {
    if (valor?.trim()) linhas.push(`- ${rotulo}: ${valor.trim()}`);
  }

  if (suplementos.length) {
    linhas.push(
      `- Suplementos indicados: ${suplementos
        .map((s) =>
          [s.nome, s.dosagem, s.frequencia, s.alerta ? `alerta: ${s.alerta}` : null]
            .filter(Boolean)
            .join(" · "),
        )
        .join(" | ")}`,
    );
  }

  if (dores.length) {
    linhas.push(
      `- Mapa de dor (mais recentes): ${dores
        .map((d) => `${d.regiao}${d.lado ? ` ${d.lado}` : ""} ${d.intensidade}/10`)
        .join(", ")}`,
    );
  }

  if (sessoes.length) {
    linhas.push("- Últimas sessões:");
    for (const s of sessoes) {
      const dor =
        s.escalaDorAntes !== null && s.escalaDorDepois !== null
          ? ` (dor ${s.escalaDorAntes}→${s.escalaDorDepois})`
          : "";
      const descricao =
        [s.avaliacaoProfissional, s.relatoCliente, s.reacoesObservadas]
          .map((campo) => campo?.trim())
          .filter(Boolean)
          .join(" · ") || "sem evolução registrada";

      linhas.push(`  - ${s.dataHora.toISOString().slice(0, 10)}${dor}: ${descricao}`);
    }
  }

  return {
    primeiroNome: dados.nome.trim().split(/\s+/)[0] ?? dados.nome,
    contexto: linhas.join("\n"),
    temConteudo: linhas.length > 0,
  };
}
