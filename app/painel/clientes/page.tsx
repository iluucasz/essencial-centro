import { ModalFormulario } from "@/components/ui/modal-formulario";
import { FormularioCliente } from "@/modules/clientes/components/formulario-cliente";
import { ListaClientes } from "@/modules/clientes/components/lista-clientes";
import { aplicarFiltroCliente, normalizarFiltroCliente } from "@/modules/clientes/filtro";
import { listarClientes } from "@/modules/clientes/queries";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string }>;
}) {
  const { busca, filtro } = await searchParams;
  const filtroAtual = normalizarFiltroCliente(filtro);
  const clientes = await listarClientes(busca);
  const clientesFiltrados = aplicarFiltroCliente(clientes, filtroAtual);

  return (
    <div className="grid gap-8">
      <header>
        <div>
          <h1 className="text-2xl font-semibold text-brand">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
            Cadastro reutilizável para agenda, fichas, sessões e evolução clínica.
          </p>
        </div>
      </header>

      <ListaClientes
        acao={
          <ModalFormulario rotuloBotao="Novo cliente" titulo="Novo cliente">
            <FormularioCliente />
          </ModalFormulario>
        }
        busca={busca}
        clientes={clientesFiltrados}
        filtro={filtroAtual}
        total={clientes.length}
      />
    </div>
  );
}
