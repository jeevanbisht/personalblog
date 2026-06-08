// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update this to your production domain before deploying.
const SITE = 'https://jblogs.net';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  integrations: [
    sitemap({
      // Help crawlers prioritise and re-crawl efficiently.
      changefreq: 'weekly',
      lastmod: new Date(),
      serialize(item) {
        if (item.url === `${SITE}/`) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (item.url.includes('/blog/')) {
          item.priority = 0.8;
        } else {
          item.priority = 0.6;
        }
        return item;
      },
    }),
  ],
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
