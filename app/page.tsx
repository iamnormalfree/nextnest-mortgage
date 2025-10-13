import { getFeatureFlags } from '@/lib/features/server-feature-flags'
import HeroSection from '@/components/HeroSection'
import ServicesSection from '@/components/ServicesSection'
import ContactSection from '@/components/ContactSection'
import SophisticatedFlowPage from '@/app/redesign/sophisticated-flow/page'

export default async function Home() {
  const flags = await getFeatureFlags()

  // Feature flag check happens on server side with runtime env vars
  if (flags.USE_SOPHISTICATED_FLOW) {
    return <SophisticatedFlowPage />
  }

  // Legacy UI (SSR-compatible)
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
