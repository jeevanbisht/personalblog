// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update this to your production domain before deploying.
const SITE = 'https://jblogs.net';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // Light/dark dual themes so code blocks follow the page theme.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
