import { ModalFormulario } from "@/components/ui/modal-formulario";
import { FormularioPacote } from "@/modules/pacotes/components/formulario-pacote";
import { ListaPacotes } from "@/modules/pacotes/components/lista-pacotes";
import { listarPacotes } from "@/modules/pacotes/queries";
import { listarClientes } from "@/modules/clientes/queries";
import { listarServicos } from "@/modules/servicos/queries";

export default async function PacotesPage() {
  const [pacotes, clientes, servicos] = await Promise.all([
    listarPacotes(),
    listarClientes(),
    listarServicos(),
  ]);

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand">Pacotes</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground">
          Sessões contratadas, realizadas e restantes por cliente.
        </p>
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Cadastrados</h2>
          <ModalFormulario rotuloBotao="Novo pacote" titulo="Novo pacote">
            <FormularioPacote
              clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
              servicos={servicos.map((s) => ({ id: s.id, nome: s.nome }))}
            />
          </ModalFormulario>
        </div>
        <ListaPacotes pacotes={pacotes} />
      </section>
    </div>
  );
}
