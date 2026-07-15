import { CalendarCheck, Heart, ImageIcon, PackageCheck } from "lucide-react";

import { CardKpi } from "@/components/ui/card-kpi";
import { GaleriaFotos } from "@/modules/fotos/components/galeria-fotos";
import { TabelaEvolucao } from "@/modules/medidas/components/tabela-evolucao";
import { ListaPacotes } from "@/modules/pacotes/components/lista-pacotes";
import type { obterResumoEvolucaoCliente } from "@/modules/evolucao/queries";

type Resumo = Awaited<ReturnType<typeof obterResumoEvolucaoCliente>>;

export function ResumoEvolucao({ resumo }: { resumo: Resumo }) {
  const pacoteDestaque = resumo.pacotes[0]?.progresso;

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CardKpi
          icone={CalendarCheck}
          label="Sessões realizadas"
          valor={String(resumo.totalSessoes)}
        />
        <CardKpi
          destaque={resumo.evolucaoDor?.melhoraGeral ? "positivo" : "neutro"}
          icone={Heart}
          label="Dor (inicial → atual)"
          valor={
            resumo.evolucaoDor
              ? `${resumo.evolucaoDor.dorInicial} → ${resumo.evolucaoDor.dorAtual}`
              : "Sem registro"
          }
        />
        <CardKpi icone={ImageIcon} label="Fotos registradas" valor={String(resumo.fotos.length)} />
        <CardKpi
          destaque={pacoteDestaque ? "positivo" : undefined}
          icone={PackageCheck}
          label="Pacote ativo"
          valor={
            pacoteDestaque
              ? `${pacoteDestaque.percentualConcluido}% concluído`
              : "Nenhum pacote ativo"
          }
        />
      </div>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Evolução de medidas</h2>
        <TabelaEvolucao evolucao={resumo.evolucaoMedidas} />
      </div>

      {resumo.pacotes.length > 0 ? (
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold text-foreground">Pacotes</h2>
          <ListaPacotes pacotes={resumo.pacotes} />
        </div>
      ) : null}

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold text-foreground">Antes e depois</h2>
        <GaleriaFotos fotos={resumo.fotos} />
      </div>
    </div>
  );
}
