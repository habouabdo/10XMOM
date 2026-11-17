import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/SectionHead';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { getConfig } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Book online, choose your Mom and pickup time. We collect, confirm the price on WhatsApp, you pay with Whish and we deliver your clothes back.',
};

const STEPS = [
  ['Book online', 'Enter your area and address. It takes less than two minutes and there is nothing to pay at this step.'],
  ['Choose your Mom', 'See the Moms who cover your area and pick the one you want, or let us choose whoever is free.'],
  ['Pick a time and add your items', 'Choose a day and a two-hour window, add what you are sending and see your estimate.'],
  ['We collect your clothes', 'Your Mom picks up your bag. Let us know about stains, delicates or special care. No need to sort.'],
  ['Final price & Whish link on WhatsApp', 'After checking your items we send the final price and a secure Whish payment link. Gift cards are deducted.'],
  ['Pay and get it back', 'As soon as you pay, your fresh, folded clothes are delivered back to your door.'],
];

export default async function HowItWorksPage() {
  const config = await getConfig();
  return (
    <>
      <PageHero eyebrow="How it works" title="From your door, back to your door" lead="No machines, no ironing board, no waiting around. Here is exactly what happens after you book." />

      <section className="py-16">
        <ol className="wrap grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card">
              <span className="text-sm font-extrabold tracking-wider text-clay-600 uppercase">Step {i + 1}</span>
              <h2 className="mt-2 text-xl">{title}</h2>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sand py-16">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Where we work</span>
            <h2 className="text-3xl">Areas we cover</h2>
            <p className="lead mt-3">We are growing across Lebanon. Don&apos;t see your area? Message us on WhatsApp and we will let you know when we arrive.</p>
            <div className="mt-6"><WhatsAppButton text="Hi 10x MoM! Do you cover my area?" label="Ask about my area" /></div>
          </div>
          <ul className="flex flex-wrap content-start gap-2" aria-label="Service areas">
            {(config?.areas ?? []).map((a) => (
              <li key={a} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-sea-700 shadow-sm">{a}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="narrow text-center">
          <h2 className="text-3xl">Ready when you are</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/book" className="btn btn-primary">Book a pickup</Link>
            <Link href="/track" className="btn btn-ghost">Track an order</Link>
          </div>
        </div>
      </section>
    </>
  );
}
