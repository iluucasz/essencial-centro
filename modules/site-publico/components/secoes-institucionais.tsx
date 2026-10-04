import { HeartHandshake } from "lucide-react";
import { CLINIC } from "@/lib/marketing/clinic";
import { blocoProfissionaisPadrao, type BlocoCabecalho } from "../blocos";
import type { ConteudoPublico } from "../validacao";
import { CarrosselProfissionais } from "./profissionais";

export { SecaoDepoimentos } from "./depoimentos";

export function SecaoProfissionais({
  itens: profissionais,
  cabecalho = blocoProfissionaisPadrao,
  whatsapp = CLINIC.whatsapp,
}: {
  itens: ConteudoPublico[];
  cabecalho?: BlocoCabecalho;
  whatsapp?: string;
}) {
  if (!profissionais.length) return null;
  return (
    <section
      id="profissionais"
      className="scroll-mt-20 overflow-hidden bg-linear-to-b from-creme to-lilas/10 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <HeartHandshake className="mx-auto mb-4 size-7 text-roxo" strokeWidth={1.25} />
          <span className="text-xs font-semibold tracking-[0.22em] text-roxo uppercase">
            {cabecalho.selo}
          </span>
          <h2 className="mt-3 font-serif text-4xl text-brand sm:text-5xl">{cabecalho.titulo}</h2>
          {cabecalho.texto && <p className="mt-5 leading-relaxed text-muted">{cabecalho.texto}</p>}
        </div>
        <CarrosselProfissionais itens={profissionais} whatsapp={whatsapp} />
      </div>
    </section>
  );
}
