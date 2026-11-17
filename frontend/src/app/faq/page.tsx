import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/SectionHead';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about booking, prices, express service, Whish payments, gift cards, pickup times and how we care for your clothes.',
};

const FAQS: [string, React.ReactNode][] = [
  ['How do I book?', <>Go to <Link href="/book">Book a pickup</Link>, choose your area, your Mom and a pickup time, then add what you are sending. You get an order code straight away.</>],
  ['How much does it cost?', <>Every item has a published price. Use our <Link href="/pricing">price calculator</Link> to see your total. Pickup and delivery is a flat fee per order.</>],
  ['Do I pay when I book?', 'No. Your Mom checks your items after pickup, then we send the final price and a Whish payment link on WhatsApp.'],
  ['What is express service?', 'Standard orders come back within 72 hours. Express orders come back the next day and cost twice the item price (pickup and delivery stays the same).'],
  ['Is there a discount for my first order?', 'Yes, your first order gets a discount on items. It is applied automatically when you book with a WhatsApp number we have not seen before.'],
  ['How do gift cards work?', <>Buy one on our <Link href="/gift-cards">gift cards page</Link>. Once paid it is active for 12 months. Enter the code when booking and the amount is deducted from the order.</>],
  ['Can I choose who handles my clothes?', 'Yes, that is what makes us different. When you book, you see the Moms who cover your area and you can pick one, or choose "Any available Mom".'],
  ['What times can you pick up?', 'We pick up in two-hour windows during the day, up to two weeks ahead. Same-day pickups are possible when a Mom is free.'],
  ['What if something needs special care?', 'Add a note when you book (stains, delicate fabrics, allergies, ironing preferences) and your Mom will follow it.'],
  ['How do I track my order?', <>Use <Link href="/track">Track order</Link> with your order code and WhatsApp number.</>],
  ['Can I cancel or change my pickup?', 'Of course. Message us on WhatsApp with your order code before your pickup time and we will sort it out.'],
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions, answered" lead="Can't find what you need? Message us on WhatsApp, a real person will reply." />
      <section className="py-14">
        <div className="narrow space-y-3">
          {FAQS.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group card p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-sea-700">
                {q}
                <span className="text-2xl text-clay-600 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="px-5 pb-5 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
