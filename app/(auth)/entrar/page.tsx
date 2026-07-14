import { possuiUsuarios } from "@/modules/auth/credenciais";
import { FormularioEntrada } from "@/modules/auth/components/formulario-entrada";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const permitirPrimeiroAcesso = !(await possuiUsuarios());

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-creme px-4 py-10">
      <FormularioEntrada permitirPrimeiroAcesso={permitirPrimeiroAcesso} />
    </main>
  );
}
