import type { APIContext } from 'astro';
import { SITE } from '../config';

// Explicitly welcome search engines and major AI crawlers, and point them
// to the sitemap and the llms.txt index for efficient discovery.
export function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const body = `# robots.txt for ${SITE.title}

User-agent: *
Allow: /

# AI assistant / crawler bots are explicitly welcome.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${site}/sitemap-index.xml
# LLM-friendly index: ${site}/llms.txt
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
