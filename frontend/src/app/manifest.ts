import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '10x MoM – Laundry pickup & delivery',
    short_name: '10x MoM',
    description: 'Book a laundry pickup, check prices and track your order.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf5ec',
    theme_color: '#0f5c63',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Book a pickup', url: '/book' },
      { name: 'Track my order', url: '/track' },
      { name: 'Price calculator', url: '/pricing' },
    ],
  };
}
