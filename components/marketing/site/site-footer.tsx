import Link from "next/link";
import { Logo } from "./logo";
import { CLINIC, SERVICES } from "@/lib/marketing/clinic";
import {
  blocoContatoPadrao,
  blocoRodapePadrao,
  linksContato,
  type BlocoContato,
  type BlocoRodape,
} from "@/modules/site-publico/blocos";

export function SiteFooter({
  categorias = SERVICES.map((servico) => servico.name),
  contato = blocoContatoPadrao,
  conteudo = blocoRodapePadrao,
}: {
  categorias?: string[];
  contato?: BlocoContato;
  conteudo?: BlocoRodape;
}) {
  const links = linksContato(contato);
  const contatos = [
    [contato.endereco, links.endereco],
    [contato.telefone, links.whatsapp],
    [contato.instagram, links.instagram],
  ].filter(([texto, href]) => texto && href);

  return (
    <footer className="border-t border-forest-deep/40 bg-forest-deep text-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo inverted />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              {conteudo.descricao}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-cream/90 uppercase">
              Serviços
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/70">
              {categorias.map((nome) => (
                <li key={nome}>
                  <Link href="/#servicos" className="transition-colors hover:text-cream">
                    {nome}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-cream/90 uppercase">
              Contato
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/70">
              {contatos.map(([texto, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-cream"
                  >
                    {texto}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/entrar" className="transition-colors hover:text-cream">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {CLINIC.name}. Todos os direitos reservados.
          </p>
          {conteudo.aviso && <p>{conteudo.aviso}</p>}
        </div>
      </div>
    </footer>
  );
}
