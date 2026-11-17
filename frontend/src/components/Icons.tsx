import type { SVGProps } from 'react';

// Simple line icons (24×24, currentColor). Decorative unless a title is given by the caller.
const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const Heart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 21s-7.6-4.7-9.7-9.4C.8 8.2 3 4.5 6.7 4.5c2.1 0 3.9 1.2 5.3 3 1.4-1.8 3.2-3 5.3-3 3.7 0 5.9 3.7 4.4 7.1C19.6 16.3 12 21 12 21z" /></svg>
);
export const Shirt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3c-.8 1.5-2.3 2.4-4 2.4S8.8 4.5 8 3z" /></svg>
);
export const Iron = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 18h18v-3a6 6 0 0 0-6-6H9" /><path d="M3 18l2.5-6H15" /><path d="M7 21h10" /></svg>
);
export const Suit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3 8 6v15h8V6z" /><path d="M8 6 4 8v13h4M16 6l4 2v13h-4" /><path d="m12 8-1 4 1 2 1-2z" /></svg>
);
export const Bed = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 19V7" /><path d="M3 14h18v5" /><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="2" /></svg>
);
export const Needle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 4 6 18" /><path d="M17 4h3v3" /><path d="M6 18c-2 2-3 1-3 1s-1-1 1-3" /><path d="M9 9c3-3 6-2 6-2" /></svg>
);
export const Rug = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h6M9 11h6M9 15h6M5 3V1M9 3V1M15 3V1M19 3V1M5 21v2M9 21v2M15 21v2M19 21v2" /></svg>
);
export const Basket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 10h18l-2 10H5z" /><path d="m8 10 4-6 4 6" /><path d="M9 14v3M12 14v3M15 14v3" /></svg>
);
export const Truck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
);
export const Gift = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13" /><path d="M12 8S10.5 3 8 4s0 4 4 4c4 0 6.5-3 4-4s-4 4-4 4" /></svg>
);
export const Building = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 21V5l8-2v18M12 8h8v13M8 8v.01M8 12v.01M8 16v.01M16 12v.01M16 16v.01M2 21h20" /></svg>
);
export const Home = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
);
export const Key = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M15 8l2 2" /></svg>
);
export const Ball = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
);
export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /><path d="M19 17v4M17 19h4" /></svg>
);
export const Calendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const Shield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Chat = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" /></svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>
);
export const Calculator = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></svg>
);
export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
