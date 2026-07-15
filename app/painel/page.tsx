import { exigirUsuarioAtual } from "@/modules/auth/queries";

export default async function PainelPage() {
  const usuario = await exigirUsuarioAtual(["profissional", "recepcao"]);

  return (
    <div className="mx-auto grid max-w-5xl gap-2">
      <h1 className="text-2xl font-semibold text-brand">Olá, {usuario.name ?? usuario.email}</h1>
      <p className="text-sm text-foreground">
        Use o menu para acessar clientes e serviços. Indicadores do dia aparecerão aqui conforme a
        agenda e as sessões forem implementadas.
      </p>
    </div>
  );
}
