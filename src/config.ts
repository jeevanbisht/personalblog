// Central place for site-wide settings used across pages and feeds.
export const SITE = {
  title: 'jblogs.net',
  description: 'Thoughts, notes, and writing on things I find interesting mostly around Identity, network access, security and AI.',
  author: 'Jeevan Bisht',
  // Used for RSS and canonical URLs. Keep in sync with astro.config.mjs `site`.
  url: 'https://jblogs.net',
  // Posts shown on the home page before "view all".
  postsPerHome: 5,
  // Default social-share image (root-relative). Add a 1200x630 PNG/JPG at
  // public/images/og-default.png for the best link previews.
  ogImage: '/images/og-default.png',
  // Profile URLs used for schema.org `sameAs` to strengthen author/entity signals.
  sameAs: ['https://github.com/jeevanbisht'],
};

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Tags', href: '/tags/' },
  { label: 'About', href: '/about/' },
];

export const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/jeevanbisht' },
  { label: 'RSS', href: '/rss.xml' },
];
