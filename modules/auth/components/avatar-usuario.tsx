import { cn } from "@/lib/utils";

/**
 * Foto de um usuário, com iniciais como reserva. Extraído do menu do usuário porque a agenda passou a
 * mostrar quem atende em cada agendamento — duas cópias divergiriam na primeira mudança.
 *
 * A foto vem sempre pela rota autenticada `/api/usuarios/[id]/foto`, nunca pela URL do Vercel Blob
 * (ver `docs/context/06-lgpd-seguranca.md`). O `?v=` carrega o pathname da imagem só como
 * cache-buster: troca de foto muda a URL e o navegador não serve a antiga.
 */
export function iniciaisDoNome(nome: string) {
  const partes = nome.trim().split(/\s+/).slice(0, 2);

  return partes.map((parte) => parte[0]?.toUpperCase()).join("") || "?";
}

const TAMANHOS = {
  xs: "size-4 text-[0.5rem]",
  sm: "size-6 text-[0.6rem]",
  md: "size-9 text-sm",
} as const;

export function AvatarUsuario({
  imagem,
  nome,
  usuarioId,
  tamanho = "md",
  className,
}: {
  imagem: string | null;
  nome: string;
  usuarioId: string;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand font-semibold text-brand-foreground",
        TAMANHOS[tamanho],
        className,
      )}
      // Em chip pequeno o nome não cabe escrito; o title deixa saber de quem é a foto.
      title={nome}
    >
      {imagem ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagem privada por rota autenticada
        <img
          alt={`Foto de ${nome}`}
          className="size-full object-cover"
          src={`/api/usuarios/${usuarioId}/foto?v=${encodeURIComponent(imagem)}`}
        />
      ) : (
        iniciaisDoNome(nome)
      )}
    </span>
  );
}
