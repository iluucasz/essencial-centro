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
    <div className="grid gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
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
