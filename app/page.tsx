import type { Metadata } from "next";
import { AboutSection } from "@/components/marketing/site/about-section";
import { connection } from "next/server";
import { numeroWhatsapp } from "@/modules/site-publico/blocos";
import { listarConteudosPublicos, obterBlocosSite } from "@/modules/site-publico/queries";
import {
  SecaoProfissionais,
  SecaoDepoimentos,
} from "@/modules/site-publico/components/secoes-institucionais";
import { ContactSection } from "@/components/marketing/site/contact-section";
import { FaqSection } from "@/components/marketing/site/faq-section";
import { HeroSection } from "@/components/marketing/site/hero-section";
import { JourneySection } from "@/components/marketing/site/journey-section";
import { PortalSection } from "@/components/marketing/site/portal-section";
import { ServicesSection } from "@/components/marketing/site/services-section";
import { SiteFooter } from "@/components/marketing/site/site-footer";
import { SiteHeader } from "@/components/marketing/site/site-header";

export const metadata: Metadata = {
  title: "Essencial Centro | Estética, Massoterapia e Bem-estar em Mesquita",
  description:
    "Sua beleza, nosso cuidado. Conheça os cuidados em estética facial e corporal, massoterapia, terapias integrativas, nutrição e podologia da Essencial Centro, em Mesquita, RJ.",
};

export default async function HomePage() {
  await connection();
  const [conteudos, { blocos }] = await Promise.all([listarConteudosPublicos(), obterBlocosSite()]);
  const categorias = blocos.catalogo.categorias.map((categoria) => categoria.nome);
  const whatsapp = numeroWhatsapp(blocos.contato.telefone);
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection
          destaques={conteudos.filter((item) => item.tipo === "destaque")}
          textos={blocos.inicio}
          faixa={blocos.faixa}
          whatsapp={whatsapp}
        />
        <ServicesSection catalogo={blocos.catalogo} whatsapp={whatsapp} />
        <JourneySection conteudo={blocos.jornada} />
        <AboutSection conteudo={blocos.sobre} />
        <SecaoProfissionais
          itens={conteudos.filter((item) => item.tipo === "profissional")}
          cabecalho={blocos.profissionais}
          whatsapp={whatsapp}
        />
        <SecaoDepoimentos
          itens={conteudos.filter((item) => item.tipo === "depoimento")}
          cabecalho={blocos.depoimentos}
        />
        <PortalSection conteudo={blocos.login} />
        <FaqSection conteudo={blocos.duvidas} />
        <ContactSection categorias={categorias} conteudo={blocos.contato} />
      </main>
      <SiteFooter categorias={categorias} contato={blocos.contato} conteudo={blocos.rodape} />
    </>
  );
}
