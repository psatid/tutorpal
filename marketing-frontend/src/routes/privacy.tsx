import { createFileRoute } from '@tanstack/react-router'
import { Footer } from '../components/footer'
import { MarketingHeader } from '../components/marketing-header'
import { useMarketingLanguage } from '../components/marketing-language'

const privacyUrl = `${import.meta.env.PUBLIC_SITE_URL ?? 'https://tutorpal.io'}/privacy`
const privacyDescription = 'How TutorPal handles beta interest form details.'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy | TutorPal' },
      { name: 'description', content: privacyDescription },
      { name: 'robots', content: 'noindex, follow' },
      { property: 'og:title', content: 'Privacy | TutorPal' },
      { property: 'og:description', content: privacyDescription },
      { property: 'og:url', content: privacyUrl },
      { name: 'twitter:title', content: 'Privacy | TutorPal' },
      { name: 'twitter:description', content: privacyDescription },
    ],
    links: [{ rel: 'canonical', href: privacyUrl }],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  const { copy } = useMarketingLanguage()

  return (
    <>
      <a className="skip-link" href="#privacy-content">{copy.common.skipToContent}</a>
      <MarketingHeader />
      <main className="privacy-page" id="privacy-content">
        <p className="section-kicker">{copy.privacy.eyebrow}</p>
        <h1>{copy.privacy.title}</h1>
        <p className="privacy-lead">{copy.privacy.lead}</p>
        <div className="privacy-copy">
          {copy.privacy.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
