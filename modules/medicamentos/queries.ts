import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { autorizarPapel } from "@/modules/auth/rbac";
import { usuario } from "@/modules/auth/schema";

import { medicamentoInformado } from "./schema";
import { contarPendentesVerificacao } from "./verificacao";

/** KPI do painel principal — conta em toda a base, não só de um cliente. */
export async function contarMedicamentosPendentesVerificacao() {
  autorizarPapel(await auth(), ["profissional"]);

  const medicamentos = await db
    .select({ verificadoEm: medicamentoInformado.verificadoEm })
    .from(medicamentoInformado);

  return contarPendentesVerificacao(medicamentos);
}

export async function listarMedicamentosDoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  return db
    .select({
      id: medicamentoInformado.id,
      nome: medicamentoInformado.nome,
      dosagem: medicamentoInformado.dosagem,
      frequencia: medicamentoInformado.frequencia,
      profissionalPrescritor: medicamentoInformado.profissionalPrescritor,
      dataInicio: medicamentoInformado.dataInicio,
      alergiaRelacionada: medicamentoInformado.alergiaRelacionada,
      alertaInteracao: medicamentoInformado.alertaInteracao,
      fonteAlerta: medicamentoInformado.fonteAlerta,
      verificadoEm: medicamentoInformado.verificadoEm,
      verificadoPorNome: usuario.name,
      criadoEm: medicamentoInformado.criadoEm,
    })
    .from(medicamentoInformado)
    .leftJoin(usuario, eq(usuario.id, medicamentoInformado.verificadoPorId))
    .where(eq(medicamentoInformado.clienteId, clienteId))
    .orderBy(desc(medicamentoInformado.criadoEm));
}
