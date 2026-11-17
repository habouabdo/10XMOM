import type { MetadataRoute } from 'next';

const PAGES = ['', '/services', '/pricing', '/book', '/gift-cards', '/about', '/how-it-works', '/faq', '/join', '/contact', '/track'];

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return PAGES.map((path) => ({ url: `${site}${path}`, changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 }));
}
