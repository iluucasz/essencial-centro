import { asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";

import { calcularEvolucaoMedida, type EvolucaoMedida } from "./evolucao";
import { medida, type LadoMedida, type RegiaoMedida } from "./schema";

export type EvolucaoAgrupada = EvolucaoMedida & {
  regiao: RegiaoMedida;
  lado: LadoMedida | null;
};

function agruparEvolucao(
  registros: {
    regiao: RegiaoMedida;
    lado: LadoMedida | null;
    dataMedicao: Date;
    valorCm: number;
  }[],
) {
  const porGrupo = new Map<
    string,
    { regiao: RegiaoMedida; lado: LadoMedida | null; itens: { data: Date; valorCm: number }[] }
  >();

  for (const registro of registros) {
    const chave = `${registro.regiao}:${registro.lado ?? ""}`;
    const grupo = porGrupo.get(chave) ?? {
      regiao: registro.regiao,
      lado: registro.lado,
      itens: [],
    };
    grupo.itens.push({ data: registro.dataMedicao, valorCm: registro.valorCm });
    porGrupo.set(chave, grupo);
  }

  const resultado: EvolucaoAgrupada[] = [];

  for (const grupo of porGrupo.values()) {
    const evolucao = calcularEvolucaoMedida(grupo.itens);
    if (evolucao) {
      resultado.push({ ...evolucao, regiao: grupo.regiao, lado: grupo.lado });
    }
  }

  return resultado;
}

export async function listarMedidasDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select()
    .from(medida)
    .where(eq(medida.clienteId, clienteId))
    .orderBy(asc(medida.dataMedicao));
}

export async function listarEvolucaoDoCliente(clienteId: string) {
  const registros = await listarMedidasDoCliente(clienteId);

  return agruparEvolucao(registros);
}

export async function listarMinhaEvolucao() {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessaoAuth, usuario.clienteId);

  const registros = await db
    .select()
    .from(medida)
    .where(eq(medida.clienteId, usuario.clienteId))
    .orderBy(asc(medida.dataMedicao));

  return agruparEvolucao(registros);
}
