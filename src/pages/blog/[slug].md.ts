import type { APIContext, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../../config';

// Serve each post as raw Markdown (with frontmatter-style metadata) so AI
// agents can consume clean, token-efficient content without parsing HTML.
export const getStaticPaths = (async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}) satisfies GetStaticPaths;

export function GET(context: APIContext) {
  const { post } = context.props as {
    post: Awaited<ReturnType<typeof getCollection>>[number];
  };
  const { title, description, pubDate, updatedDate, tags } = post.data;

  const meta = [
    `# ${title}`,
    '',
    `> ${description}`,
    '',
    `- Author: ${SITE.author}`,
    `- Published: ${pubDate.toISOString().slice(0, 10)}`,
    ...(updatedDate
      ? [`- Updated: ${updatedDate.toISOString().slice(0, 10)}`]
      : []),
    ...(tags.length ? [`- Tags: ${tags.join(', ')}`] : []),
    '',
    '---',
    '',
  ].join('\n');

  const body = `${meta}${post.body ?? ''}`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
