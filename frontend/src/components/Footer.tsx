import Link from 'next/link';
import { Logo } from './Logo';
import { WhatsAppButton } from './WhatsAppButton';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      ['/services', 'Services'],
      ['/pricing', 'Pricing & calculator'],
      ['/how-it-works', 'How it works'],
      ['/about', 'About us'],
      ['/faq', 'FAQ'],
    ],
  },
  {
    title: 'Your order',
    links: [
      ['/book', 'Book a pickup'],
      ['/track', 'Track an order'],
      ['/gift-cards', 'Gift cards'],
      ['/contact', 'Contact us'],
    ],
  },
  {
    title: 'Work with us',
    links: [
      ['/join', 'Become a Mom'],
      ['/services#business', 'Business laundry'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-sea-800 text-sea-100">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-sea-200">
            Laundry picked up, washed, ironed and brought back by a Mom you choose. Serving Lebanon.
          </p>
          <div className="mt-4">
            <WhatsAppButton className="btn-sm" />
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-base text-white">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sea-100 no-underline hover:text-saffron-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-sea-700">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-sea-200 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} 10x MoM. All rights reserved.</span>
          <span>Payments by Whish · Updates on WhatsApp</span>
        </div>
      </div>
    </footer>
  );
}
