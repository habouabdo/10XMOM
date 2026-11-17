import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ServiceWorker } from '@/components/ServiceWorker';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-fredoka', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-nunito', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: '10x MoM – Laundry pickup & delivery in Lebanon', template: '%s – 10x MoM' },
  description:
    'Choose a Mom, pick a time, and we collect your clothes, wash, iron and bring them back. Transparent prices, gift cards, and easy Whish payments across Lebanon.',
  applicationName: '10x MoM',
  appleWebApp: { capable: true, title: '10x MoM', statusBarStyle: 'default' },
  openGraph: { type: 'website', siteName: '10x MoM', locale: 'en_LB' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#0f5c63',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ServiceWorker />
      </body>
    </html>
  );
}
