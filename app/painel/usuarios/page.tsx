import { UserPlus } from "lucide-react";

import { ModalFormulario } from "@/components/ui/modal-formulario";
import { FormularioUsuario } from "@/modules/auth/components/formulario-usuario";
import { ListaUsuarios } from "@/modules/auth/components/lista-usuarios";
import { exigirUsuarioAtual, listarUsuarios } from "@/modules/auth/queries";
import { listarClientes } from "@/modules/clientes/queries";

export default async function UsuariosPage() {
  const usuarioAtual = await exigirUsuarioAtual(["profissional"]);

  const [usuarios, clientesBrutos] = await Promise.all([listarUsuarios(), listarClientes()]);
  const clientes = clientesBrutos.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Usuários</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground">
            Acesso ao painel e ao portal — área interna, não visível ao cliente.
          </p>
        </div>

        <ModalFormulario
          icone={<UserPlus className="size-4" aria-hidden />}
          rotuloBotao="Novo usuário"
          titulo="Criar usuário"
        >
          <FormularioUsuario clientes={clientes} />
        </ModalFormulario>
      </header>

      <ListaUsuarios clientes={clientes} usuarioAtualId={usuarioAtual.id} usuarios={usuarios} />
    </div>
  );
}
