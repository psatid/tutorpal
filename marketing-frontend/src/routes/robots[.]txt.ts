import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots.txt')({
  server: { handlers: { GET: () => new Response('User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: /sitemap.xml\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } }) } },
})
