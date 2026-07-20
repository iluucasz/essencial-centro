import { SiteHeader } from "@/components/site/site-header"
import { HeroSection } from "@/components/site/hero-section"
import { ServicesSection } from "@/components/site/services-section"
import { JourneySection } from "@/components/site/journey-section"
import { AboutSection } from "@/components/site/about-section"
import { PortalSection } from "@/components/site/portal-section"
import { FaqSection } from "@/components/site/faq-section"
import { ContactSection } from "@/components/site/contact-section"
import { SiteFooter } from "@/components/site/site-footer"

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
  )
}
