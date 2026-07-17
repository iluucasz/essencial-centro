import { ModalFormulario } from "@/components/ui/modal-formulario";
import { exigirUsuarioAtual } from "@/modules/auth/queries";
import { podeGerenciarServicos } from "@/modules/servicos/acesso";
import { FormularioServico } from "@/modules/servicos/components/formulario-servico";
import { ListaServicos } from "@/modules/servicos/components/lista-servicos";
import { listarServicos } from "@/modules/servicos/queries";

export default async function ServicosPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);
  const servicos = await listarServicos();
  const podeGerenciar = podeGerenciarServicos(usuario);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Serviços</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Catálogo usado por agenda, pacotes e fichas de avaliação.
        </p>
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Cadastrados</h2>
          {podeGerenciar ? (
            <ModalFormulario rotuloBotao="Novo serviço" titulo="Novo serviço">
              <FormularioServico />
            </ModalFormulario>
          ) : null}
        </div>
        <ListaServicos podeGerenciar={podeGerenciar} servicos={servicos} />
      </section>
    </div>
  );
}
