// Central place for site-wide settings used across pages and feeds.
export const SITE = {
  title: 'My Personal Blog',
  description: 'Thoughts, notes, and writing on things I find interesting.',
  author: 'Jeevan Bisht',
  // Used for RSS and canonical URLs. Keep in sync with astro.config.mjs `site`.
  url: 'https://jblogs.net',
  // Posts shown on the home page before "view all".
  postsPerHome: 5,
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
