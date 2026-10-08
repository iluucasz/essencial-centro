import { auth } from "@/auth";
import { autorizarPapel } from "@/modules/auth/rbac";
import { podeExcluirClientes } from "@/modules/clientes/acesso";
import { ListaClientes } from "@/modules/clientes/components/lista-clientes";
import { ModalAtribuirTag } from "@/modules/clientes/components/modal-atribuir-tag";
import { ModalNovoCliente } from "@/modules/clientes/components/modal-novo-cliente";
import {
  aplicarFiltroCliente,
  aplicarFiltroTagCliente,
  normalizarFiltroCliente,
} from "@/modules/clientes/filtro";
import { listarClientes, listarClientesParaTags } from "@/modules/clientes/queries";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; tag?: string }>;
}) {
  const { busca, filtro, tag } = await searchParams;
  const usuarioAtual = autorizarPapel(await auth(), ["profissional", "recepcao"]);
  const filtroAtual = normalizarFiltroCliente(filtro);
  const [clientes, clientesParaTags] = await Promise.all([
    listarClientes(busca),
    listarClientesParaTags(),
  ]);
  const tagsDisponiveis = Array.from(
    new Set(clientesParaTags.map((cliente) => cliente.tag?.trim()).filter(Boolean)),
  ).sort((a, b) => a!.localeCompare(b!, "pt-BR")) as string[];
  const clientesFiltrados = aplicarFiltroTagCliente(
    aplicarFiltroCliente(clientes, filtroAtual),
    tag,
  );

  return (
    <div className="grid min-w-0 gap-6 sm:gap-8">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-foreground">
            Gerencie prontuários, fichas e evolução de cada cliente.
          </p>
        </div>

        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <ModalAtribuirTag clientes={clientesParaTags} />
          <ModalNovoCliente />
        </div>
      </header>

      <ListaClientes
        busca={busca}
        clientes={clientesFiltrados}
        filtro={filtroAtual}
        podeExcluir={podeExcluirClientes(usuarioAtual)}
        tag={tag}
        tagsDisponiveis={tagsDisponiveis}
        total={clientes.length}
      />
    </div>
  );
}
