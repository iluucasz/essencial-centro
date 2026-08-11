import Image from "next/image";
import Link from "next/link";

import { CLINIC } from "@/lib/marketing/clinic";

/**
 * Marca da clínica. O PNG já traz o nome "Essencial Centro" desenhado, então não há texto ao lado —
 * repetir viraria "Essencial Centro Essencial Centro".
 *
 * `inverted` é usado sobre fundo escuro (rodapé, lateral do login). A arte é verde sobre transparente
 * e se sustenta nos dois fundos; o que muda é só um leve clareamento pra não ficar abafada no escuro.
 */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center" aria-label={CLINIC.name}>
      <Image
        alt={CLINIC.name}
        className={inverted ? "h-12 w-auto brightness-110" : "h-12 w-auto"}
        // `marca.png` é o `logotipo.png` recortado na arte e reduzido: o original é quadrado com
        // ~35% de margem transparente, então renderizaria pequeno dentro da própria caixa.
        height={512}
        priority
        src="/logo/marca.png"
        width={424}
      />
    </Link>
  );
}
