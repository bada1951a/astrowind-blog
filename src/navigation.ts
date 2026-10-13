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
    // 푸터에 조용하게 들어가는 관리자용 언어별 아카이브
    {
      title: 'Global Editions',
      links: [
        { text: '🇺🇸 English', href: '/en' },
        { text: '🇯🇵 日本語', href: '/ja' },
        { text: '🇻🇳 Tiếng Việt', href: '/vi' },
        { text: '🇧🇷 Português', href: '/pt' },
        { text: '🇩🇪 Deutsch', href: '/de' },
        { text: '🇫🇷 Français', href: '/fr' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'About Us', href: getPermalink('/about') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms of Service', href: getPermalink('/terms') },
    { text: 'ES', href: '/es' },
    { text: 'ID', href: '/id' },
    { text: 'IT', href: '/it' },
    { text: 'NL', href: '/nl' },
    { text: 'PL', href: '/pl' },
  ],
  socialLinks: [],
  footNote: `
    © 2026 Daily Insight. All rights reserved.
  `,
};
