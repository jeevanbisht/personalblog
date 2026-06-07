import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';

// llms-full.txt: the entire blog concatenated into a single Markdown document
// so an AI agent can fetch all content in one request.
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const header = `# ${SITE.title} — Full Content

> ${SITE.description}

Author: ${SITE.author}
Site: ${site}

This file contains the full text of every published blog post, concatenated
for AI agents. Generated automatically.

`;

  const sections = posts.map((post) => {
    const { title, description, pubDate, updatedDate, tags } = post.data;
    const meta = [
      `## ${title}`,
      '',
      `> ${description}`,
      '',
      `- URL: ${site}/blog/${post.id}/`,
      `- Published: ${pubDate.toISOString().slice(0, 10)}`,
      ...(updatedDate
        ? [`- Updated: ${updatedDate.toISOString().slice(0, 10)}`]
        : []),
      ...(tags.length ? [`- Tags: ${tags.join(', ')}`] : []),
      '',
    ].join('\n');
    return `${meta}\n${post.body ?? ''}`;
  });

  const body = header + sections.join('\n\n---\n\n') + '\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
