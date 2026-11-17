'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/gift-cards', label: 'Gift cards' },
  { href: '/about', label: 'About us' },
  { href: '/join', label: 'Become a Mom' },
  { href: '/track', label: 'Track order' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <a href="#main" className="absolute -left-[9999px] top-2 z-50 rounded-lg bg-sea-700 px-4 py-2 text-white focus:left-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-linen/90 backdrop-blur">
        <div className="wrap flex h-[72px] items-center justify-between gap-4">
          <Logo />
          <button
            type="button"
            className="rounded-lg p-2 text-sea-700 lg:hidden"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          <nav
            id="site-nav"
            aria-label="Main"
            className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-[72px] flex-col gap-1 border-b border-line bg-linen p-4 shadow-lg lg:static lg:flex lg:flex-row lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className="rounded-full px-3 py-2 font-bold text-sea-700 no-underline hover:bg-sea-50 aria-[current=page]:bg-sea-50 aria-[current=page]:text-clay-700"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/book" className="btn btn-primary btn-sm mt-2 lg:ml-2 lg:mt-0">
              Book a pickup
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
