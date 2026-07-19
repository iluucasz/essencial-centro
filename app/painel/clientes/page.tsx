import { auth } from "@/auth";
import { ModalFormulario } from "@/components/ui/modal-formulario";
import { autorizarPapel } from "@/modules/auth/rbac";
import { podeExcluirClientes } from "@/modules/clientes/acesso";
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
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const filtroAtual = normalizarFiltroCliente(filtro);
  const clientes = await listarClientes(busca);
  const clientesFiltrados = aplicarFiltroCliente(clientes, filtroAtual);

  return (
    <div className="grid min-w-0 gap-6 sm:gap-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-foreground">
            Gerencie prontuários, fichas e evolução de cada cliente.
          </p>
        </div>

        <ModalFormulario rotuloBotao="Novo cliente" titulo="Novo cliente">
          <FormularioCliente />
        </ModalFormulario>
      </header>

      <ListaClientes
        busca={busca}
        clientes={clientesFiltrados}
        filtro={filtroAtual}
        podeExcluir={podeExcluirClientes(usuarioAtual)}
        total={clientes.length}
      />
    </div>
  );
}
