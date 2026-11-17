import type { Metadata } from 'next';
import { Gift } from '@/components/Icons';
import { PageHero } from '@/components/SectionHead';
import { GiftCardBalance, GiftCardForm } from './GiftCardForm';

export const metadata: Metadata = {
  title: 'Gift cards',
  description: 'Give a 10x MoM laundry gift card: perfect for new mums, baby showers, busy families, Mother’s Day and friends who need a break.',
};

const OCCASIONS = ['New mums & baby showers', 'Busy families', 'Mother’s Day', 'Birthdays', 'Ramadan & Eid', 'Housewarmings', 'Thank-you gifts', 'Students living alone'];

export default function GiftCardsPage() {
  return (
    <>
      <PageHero eyebrow="Gift cards" title="Give the gift of a laundry-free week" lead="Choose an amount, add a personal message, and we send your gift card code on WhatsApp once it is paid.">
        <ul className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <li key={o} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-sea-700 shadow-sm">
              <Gift className="h-4 w-4 text-clay-600" /> {o}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="py-14">
        <div className="wrap">
          <GiftCardForm />
        </div>
      </section>

      <section className="bg-sand py-14">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl">How gift cards work</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
              <li>Fill in the form. You get a gift card code straight away.</li>
              <li>We send you a Whish payment link on WhatsApp.</li>
              <li>Once paid, the card is active for 12 months. Share the code with your loved one.</li>
              <li>They enter the code when booking. The amount is deducted from their order, and any balance stays on the card.</li>
            </ol>
          </div>
          <GiftCardBalance />
        </div>
      </section>
    </>
  );
}
