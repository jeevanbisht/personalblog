---
title: 'Deploying an Astro Blog to Cloudflare Pages'
description: 'A short walkthrough of getting this site live on the Cloudflare free tier.'
pubDate: 2026-06-03
tags: ['cloudflare', 'astro', 'guide']
---

Cloudflare Pages is a great home for a static blog: it's free, fast, and
globally distributed. Because the site is pre-rendered to static HTML, requests
are served straight from Cloudflare's cache — you rarely touch any Worker
limits.

## Option 1: Git integration (recommended)

1. Push this project to a GitHub/GitLab repository.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages**.
3. Connect your repo and set:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Save and deploy. Every push to your main branch redeploys automatically.

## Option 2: Direct upload with Wrangler

```sh
npm run build
npx wrangler pages deploy dist
```

That's it. Update the `site` value in `astro.config.mjs` and `src/config.ts`
to your real domain so RSS and canonical links are correct.
