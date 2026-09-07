import { createFileRoute } from '@tanstack/react-router'
import { MarketingHomepage } from '../components/marketing-homepage'

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
  return <MarketingHomepage nativeStatus={beta} />
}
