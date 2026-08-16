import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { MarketingLanguageProvider } from '../components/marketing-language'
import appCss from '../styles.css?url'

const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://tutorpal.io'
const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TutorPal | Your tutoring work, in one clear place.',
      },
      {
        name: 'description',
        content:
          'TutorPal helps independent tutors plan sessions, track hours, and keep their teaching work connected.',
      },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'TutorPal' },
      { property: 'og:title', content: 'Your tutoring work, in one clear place.' },
      {
        property: 'og:description',
        content: 'Plan sessions, track hours, and keep every student moving forward.',
      },
      { property: 'og:url', content: siteUrl },
      { property: 'og:image', content: `${siteUrl}/social-preview.svg` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Your tutoring work, in one clear place.' },
      { name: 'twitter:description', content: 'Plan sessions, track hours, and keep every student moving forward.' },
      { name: 'twitter:image', content: `${siteUrl}/social-preview.svg` },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'TutorPal',
          url: siteUrl,
          description: 'Calm operations for independent tutors.',
        }),
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <MarketingLanguageProvider>{children}</MarketingLanguageProvider>
        <Scripts />
        {turnstileSiteKey ? (
          <script
            async
            defer
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          />
        ) : null}
      </body>
    </html>
  )
}
