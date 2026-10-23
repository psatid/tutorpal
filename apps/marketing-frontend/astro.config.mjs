import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://tutorpal.io', output: 'static', trailingSlash: 'always',
  i18n: { defaultLocale: 'en', locales: ['en', 'th'], routing: { prefixDefaultLocale: false } },
});
