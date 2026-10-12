import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: '홈',
      href: getPermalink('/'),
    },
    {
      text: '전체 글',
      href: getBlogPermalink(),
    },
    {
      text: '테크 & IT',
      href: getPermalink('Tech', 'category'),
    },
  ],
  actions: [{ text: '글 목록 보러가기', href: getBlogPermalink() }],
};

export const footerData = {
  links: [
    {
      title: '카테고리',
      links: [
        { text: '전체 글 보기', href: getBlogPermalink() },
        { text: '테크 & IT', href: getPermalink('Tech', 'category') },
      ],
    },
    {
      title: '블로그',
      links: [
        { text: '홈으로', href: getPermalink('/') },
      ],
    },
  ],
  secondaryLinks: [],
  socialLinks: [],
  footNote: `
    © 2026 데일리 인사이트 (Daily Insight) · All rights reserved.
  `,
};