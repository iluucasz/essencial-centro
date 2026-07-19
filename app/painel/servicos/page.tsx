import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { podeGerenciarServicos } from "@/modules/servicos/acesso";
import { FormularioServico } from "@/modules/servicos/components/formulario-servico";
import { ListaServicos } from "@/modules/servicos/components/lista-servicos";
import { listarOpcoesServico, listarServicos } from "@/modules/servicos/queries";

export default async function ServicosPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const [servicos, opcoesGrupo, opcoesPeriodicidade] = await Promise.all([
    listarServicos(),
    listarOpcoesServico("grupo"),
    listarOpcoesServico("periodicidade"),
  ]);
  const podeGerenciar = podeGerenciarServicos(usuario);

  return (
    <div className="grid min-w-0 gap-6 sm:gap-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-brand">Serviços</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
            Catálogo usado por agenda, pacotes e fichas de avaliação.
          </p>
        </div>

        {podeGerenciar ? (
          <ModalFormulario rotuloBotao="Novo serviço" titulo="Novo serviço">
            <FormularioServico
              opcoesGrupo={opcoesGrupo}
              opcoesPeriodicidade={opcoesPeriodicidade}
            />
          </ModalFormulario>
        ) : null}
      </header>

      <ListaServicos
        opcoesGrupo={opcoesGrupo}
        opcoesPeriodicidade={opcoesPeriodicidade}
        podeGerenciar={podeGerenciar}
        servicos={servicos}
      />
    </div>
  );
}
