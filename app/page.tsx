import { AboutSection } from "@/components/marketing/site/about-section";
import { ContactSection } from "@/components/marketing/site/contact-section";
import { FaqSection } from "@/components/marketing/site/faq-section";
import { HeroSection } from "@/components/marketing/site/hero-section";
import { JourneySection } from "@/components/marketing/site/journey-section";
import { PortalSection } from "@/components/marketing/site/portal-section";
import { ServicesSection } from "@/components/marketing/site/services-section";
import { SiteFooter } from "@/components/marketing/site/site-footer";
import { SiteHeader } from "@/components/marketing/site/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ServicesSection />
        <JourneySection />
        <AboutSection />
        <PortalSection />
        <FaqSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
