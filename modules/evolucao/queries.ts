import { auth } from "@/auth";
import { autorizarClienteDono, autorizarPapel, ErroAutorizacao } from "@/modules/auth/rbac";
import { listarFotosDoCliente, listarMinhasFotos } from "@/modules/fotos/queries";
import {
  listarEvolucaoDoCliente,
  listarMinhaEvolucao as listarMinhaEvolucaoMedidas,
} from "@/modules/medidas/queries";
import { listarMeusPacotes, listarPacotesDoCliente } from "@/modules/pacotes/queries";
import { listarMinhasSessoes, listarSessoesDoCliente } from "@/modules/sessoes/queries";

import { calcularEvolucaoDorPeriodo } from "./dor-periodo";

/** Visão consolidada para a profissional: tudo que já foi registrado sobre o tratamento. */
export async function obterResumoEvolucaoCliente(clienteId: string) {
  autorizarPapel(await auth(), ["profissional"]);

  const [sessoes, evolucaoMedidas, fotos, pacotes] = await Promise.all([
    listarSessoesDoCliente(clienteId),
    listarEvolucaoDoCliente(clienteId),
    listarFotosDoCliente(clienteId),
    listarPacotesDoCliente(clienteId),
  ]);

  const evolucaoDor = calcularEvolucaoDorPeriodo(
    sessoes.map((s) => ({
      data: s.dataHora,
      dorAntes: s.escalaDorAntes,
      dorDepois: s.escalaDorDepois,
    })),
  );

  return {
    totalSessoes: sessoes.length,
    evolucaoDor,
    evolucaoMedidas,
    fotos,
    pacotes: pacotes.filter((p) => p.ativo),
  };
}

/** Mesma visão, mas para o próprio cliente no portal (sem nada de conteúdo profissional). */
export async function obterMinhaEvolucao() {
  const sessaoAuth = await auth();
  const usuario = autorizarPapel(sessaoAuth, ["cliente"]);

  if (!usuario.clienteId) {
    throw new ErroAutorizacao(
      "Seu usuário ainda não está vinculado a um cadastro de cliente.",
      403,
    );
  }

  autorizarClienteDono(sessaoAuth, usuario.clienteId);

  const [sessoes, evolucaoMedidas, fotos, pacotes] = await Promise.all([
    listarMinhasSessoes(),
    listarMinhaEvolucaoMedidas(),
    listarMinhasFotos(),
    listarMeusPacotes(),
  ]);

  const evolucaoDor = calcularEvolucaoDorPeriodo(
    sessoes.map((s) => ({
      data: s.dataHora,
      dorAntes: s.escalaDorAntes,
      dorDepois: s.escalaDorDepois,
    })),
  );

  return {
    totalSessoes: sessoes.length,
    evolucaoDor,
    evolucaoMedidas,
    fotos,
    pacotes: pacotes.filter((p) => p.ativo),
  };
}
