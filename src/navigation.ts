import { getPermalink, getBlogPermalink, getHomePermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getHomePermalink(),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Tech & IT',
      href: getPermalink('/category/hardware'),
    },
  ],
  actions: [{ text: 'Explore Articles', href: getBlogPermalink() }],
};

export const footerData = {
  links: [
    {
      title: 'Categories',
      links: [
        { text: 'All Articles', href: getBlogPermalink() },
        { text: 'Tech & IT', href: getPermalink('/category/hardware') },
      ],
    },
    {
      title: 'Blog',
      links: [
        { text: 'Home', href: getHomePermalink() },
        { text: 'Articles', href: getBlogPermalink() },
        { text: 'About & Contact', href: getPermalink('/about') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'About Us', href: getPermalink('/about') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms of Service', href: getPermalink('/terms') },
    { text: 'Sitemap', href: '/sitemap-0.xml' },
  ],
  socialLinks: [],
  footNote: `
    © 2026 Daily Insight. All rights reserved.
  `,
};
