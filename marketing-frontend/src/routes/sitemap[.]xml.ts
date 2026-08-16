import { createFileRoute } from '@tanstack/react-router'

const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://tutorpal.io'

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } }) } },
})
