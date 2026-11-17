import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Home, Shield, Sparkle } from '@/components/Icons';
import { PageHero, SectionHead } from '@/components/SectionHead';
import { getConfig } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'About us',
  description: '10x MoM is a Lebanese laundry pickup and delivery service run by a network of local Moms who care for your clothes like their own family’s.',
};

// NOTE: replace the story paragraphs with the founders' real story before launch.
const VALUES = [
  { icon: Heart, title: 'Care', text: 'Every piece is handled the way a mother would handle her own family’s clothes.' },
  { icon: Shield, title: 'Trust', text: 'You choose the Mom who comes to your door, and you see every step of your order.' },
  { icon: Sparkle, title: 'Fairness', text: 'Published prices, no surprises, and you pay only after your items are checked.' },
  { icon: Home, title: 'Local', text: 'Our Moms work in their own neighbourhoods, earning on hours that fit their lives.' },
];

export default async function AboutPage() {
  const config = await getConfig();
  const areas = config?.areas ?? [];

  return (
    <>
      <PageHero eyebrow="About us" title="Laundry, handled the way Mom would">
        <blockquote className="max-w-2xl rounded-2xl border-l-4 border-clay-500 bg-white p-6 font-display text-xl text-sea-700 shadow-[var(--shadow-soft)]">
          “10x MoM is a laundry pickup and delivery service powered by Moms across Lebanon.”
        </blockquote>
      </PageHero>

      <section className="overflow-hidden py-16">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-4 text-lg text-muted">
            <h2 className="text-3xl">Our story</h2>
            <p>
              10x MoM started with a simple idea: the people who care most about clothes are often the Moms who have been
              washing, ironing and folding for their families for years. Meanwhile, busy families, new parents and working
              professionals across Lebanon are short on the one thing laundry takes the most of: time.
            </p>
            <p>
              So we connected the two. Families book online, choose a Mom from their own area, and get their laundry
              collected, cleaned and brought back. Moms earn from a skill they already have, on hours that suit them.
            </p>
            <p>
              Ten times easier for you, ten times more meaningful for the Moms who do it. That is where the name comes from.
            </p>
          </div>
          <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md">
            <div className="absolute inset-0 rotate-6 rounded-[3rem] bg-clay-100" />
            <div className="absolute inset-0 -rotate-3 rounded-[3rem] bg-sea-600" />
            <div className="absolute inset-0 grid place-items-center rounded-[3rem]">
              <div className="text-center text-white">
                <Heart className="mx-auto h-20 w-20 text-saffron-300" />
                <p className="mt-4 font-display text-3xl font-bold">10x easier</p>
                <p className="text-sea-100">for families · for Moms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="wrap">
          <SectionHead eyebrow="What we stand for" title="Our values" center />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-clay-50 text-clay-600"><Icon className="h-7 w-7" /></span>
                <h3 className="text-xl">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20">
        <div className="wrap grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl">How we work</h2>
            <div className="mt-4 space-y-4 text-muted">
              <p>Your local Mom picks up your laundry from your home or workplace, cleans it with care, and returns it folded or pressed. We also collect towels, sheets and uniforms from small businesses.</p>
              <p>Our team handles bookings, pricing and Whish payments, so Moms can focus on the laundry and you can follow every step on WhatsApp and on our tracking page.</p>
            </div>
            <ul className="mt-6 space-y-2">
              <li><Link href="/how-it-works">How it works, step by step</Link></li>
              <li><Link href="/pricing">Our prices and calculator</Link></li>
              <li><Link href="/faq">Frequently asked questions</Link></li>
              <li><Link href="/join">Become a Mom</Link></li>
            </ul>
          </div>
          <div className="card">
            <h2 className="text-2xl">Where we work</h2>
            <p className="mt-2 text-muted">We are growing across Lebanon. Don&apos;t see your area? Message us and we will let you know when we arrive.</p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Service areas">
              {areas.map((a) => (
                <li key={a} className="rounded-full bg-sea-50 px-3 py-1 text-sm font-semibold text-sea-700">{a}</li>
              ))}
            </ul>
            <Link href="/book" className="btn btn-primary mt-6">Book online</Link>
          </div>
        </div>
      </section>
    </>
  );
}
