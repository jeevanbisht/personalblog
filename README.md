# JBlogs.net

Source for [JBlogs.net](https://jblogs.net) — a fast, static blog built with
[Astro](https://astro.build) and deployed for free on
[Cloudflare Pages](https://pages.cloudflare.com).

Because every page is pre-rendered to static HTML and served from Cloudflare's
global CDN, the site stays comfortably inside the Cloudflare free tier — you
rarely invoke a Worker at all.

## Features

- ✍️ Markdown blog posts (`src/content/blog/`)
- 🏠 Home page with latest posts
- 📚 Full blog index
- 🏷️ Tags / categories with per-tag pages
- 🌗 Light/dark mode toggle (no flash on load)
- 📡 RSS feed (`/rss.xml`) + sitemap (`/sitemap-index.xml`)
- 🔒 Sensible security headers (`public/_headers`)

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
```

## Writing a post

Create a Markdown file in `src/content/blog/`, e.g. `my-post.md`:

```md
---
title: 'My Post Title'
description: 'A short summary used in lists and RSS.'
pubDate: 2026-06-06
tags: ['example']
draft: false
---

Your content here…
```

Set `draft: true` to hide a post from the site and feed.

## Configuration

- Edit site title, author, and nav in [`src/config.ts`](src/config.ts).
- Set your production domain in both [`astro.config.mjs`](astro.config.mjs)
  (`site`) and `src/config.ts` (`url`) so RSS and canonical links are correct.

## Build

```sh
npm run build    # outputs to ./dist
npm run preview  # preview the production build locally
```

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Push this repo to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages** → connect repo.
3. Build command: `npm run build` · Output directory: `dist`.
4. Deploy. Pushes to your main branch redeploy automatically.

### Option B — Direct upload with Wrangler

```sh
npm run build
npx wrangler pages deploy dist
```

## License

MIT — make it your own.
