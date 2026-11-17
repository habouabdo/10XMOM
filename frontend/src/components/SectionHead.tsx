import type { ReactNode } from 'react';

export function SectionHead({ eyebrow, title, lead, center = false, as: Tag = 'h2' }: {
  eyebrow?: string; title: ReactNode; lead?: ReactNode; center?: boolean; as?: 'h1' | 'h2';
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag className={Tag === 'h1' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}>{title}</Tag>
      {lead && <p className="lead mt-4">{lead}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sand to-linen py-14 sm:py-20">
      <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-clay-100 opacity-70" />
      <div aria-hidden className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sea-100 opacity-60" />
      <div className="wrap relative">
        <SectionHead as="h1" eyebrow={eyebrow} title={title} lead={lead} />
        {children}
      </div>
    </section>
  );
}
