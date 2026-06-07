import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';

// Implements the llms.txt convention (https://llmstxt.org): a concise,
// Markdown index of the site that LLMs and AI agents can read to understand
// the available content and where to find it.
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const postLines = posts
    .map((post) => {
      const date = post.data.pubDate.toISOString().slice(0, 10);
      return `- [${post.data.title}](${site}/blog/${post.id}/) (${date}, Markdown: ${site}/blog/${post.id}.md): ${post.data.description}`;
    })
    .join('\n');

  const body = `# ${SITE.title}

> ${SITE.description}

Author: ${SITE.author}
Site: ${site}

This file follows the llms.txt convention to help AI agents discover and read
content. Every blog post is also available as raw Markdown by appending \`.md\`
to its URL.

## Blog posts

${postLines}

## Pages

- [Blog index](${site}/blog/): All posts.
- [Tags](${site}/tags/): Browse posts by topic.
- [About](${site}/about/): About ${SITE.author}.

## Feeds

- [RSS](${site}/rss.xml): Subscribe to new posts.
- [Sitemap](${site}/sitemap-index.xml): Full list of URLs.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
