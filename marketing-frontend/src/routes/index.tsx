import { createFileRoute } from '@tanstack/react-router'
import { BetaLeadForm } from '../components/beta-lead-form'
import { Footer } from '../components/footer'
import { FaqSection } from '../components/faq-section'
import { MarketingHeader } from '../components/marketing-header'
import { HeroSection } from '../components/hero-section'
import { useMarketingLanguage } from '../components/marketing-language'
import { WorkflowSection } from '../components/workflow-section'
import { WhatYouGetSection } from '../components/what-you-get-section'

export const Route = createFileRoute('/')({
  head: () => ({
    links: [{ rel: 'canonical', href: `${import.meta.env.PUBLIC_SITE_URL ?? 'https://tutorpal.io'}/` }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    beta: search.beta === 'success' ? ('success' as const) : search.beta === 'error' ? ('error' as const) : undefined,
  }),
  component: Home,
})

function Home() {
  const { beta } = Route.useSearch()
  const { copy } = useMarketingLanguage()

  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.common.skipToContent}
      </a>
      <MarketingHeader />
      <main id="main-content">
        <HeroSection />
        <WorkflowSection />
        <WhatYouGetSection />
        <FaqSection />
        <section className="beta-section" id="beta" aria-labelledby="beta-title">
          <div className="section-layout beta-layout">
            <div className="beta-copy">
              <h2 id="beta-title">{copy.beta.title}</h2>
              <p>{copy.beta.description}</p>
              <p className="small-print">
                {copy.beta.smallPrintBefore} <a href="/privacy">{copy.common.privacy}</a>{copy.beta.smallPrintAfter}
              </p>
            </div>
            <BetaLeadForm nativeStatus={beta} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
