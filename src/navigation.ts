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
      text: '🌐 Language',
      links: [
        { text: '🇰🇷 한국어 (KO)', href: getBlogPermalink() },
        { text: '🇺🇸 English (EN)', href: getPermalink('/en') },
        { text: '🇯🇵 日本語 (JA)', href: getPermalink('/ja') },
        { text: '🇻🇳 Tiếng Việt (VI)', href: getPermalink('/vi') },
        { text: '🇧🇷 Português (PT)', href: getPermalink('/pt') },
        { text: '🇩🇪 Deutsch (DE)', href: getPermalink('/de') },
        { text: '🇫🇷 Français (FR)', href: getPermalink('/fr') },
        { text: '🇪🇸 Español (ES)', href: getPermalink('/es') },
        { text: '🇮🇩 Indonesia (ID)', href: getPermalink('/id') },
        { text: '🇮🇹 Italiano (IT)', href: getPermalink('/it') },
        { text: '🇳🇱 Nederlands (NL)', href: getPermalink('/nl') },
        { text: '🇵🇱 Polski (PL)', href: getPermalink('/pl') },
      ],
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
  ],
  socialLinks: [],
  footNote: `
    © 2026 Daily Insight. All rights reserved.
  `,
};
