import type { Metadata } from 'next';
import { Check } from '@/components/Icons';
import { JoinForm } from './JoinForm';

export const metadata: Metadata = {
  title: 'Become a Mom',
  description: 'Join 10x MoM: flexible laundry work in your own area of Lebanon. Apply in two minutes.',
};

const PERKS = [
  ['Flexible hours', 'Choose the areas and time windows you want to work.'],
  ['Customers near you', 'Orders come from your own neighbourhood.'],
  ['We handle the admin', 'Bookings, pricing and Whish payments are managed by our team.'],
  ['Clear prices', 'Every item has a published price, so there is no haggling at the door.'],
];

export default function JoinPage() {
  return (
    <section className="bg-gradient-to-b from-sand to-linen py-16">
      <div className="wrap grid gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow">Become a Mom</span>
          <h1 className="text-4xl sm:text-5xl">Turn your care into income</h1>
          <p className="lead mt-4">Pick up, wash, iron and deliver laundry for families in your own area, on hours that fit your life.</p>
          <ul className="mt-8 space-y-4">
            {PERKS.map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clay-600 text-white"><Check className="h-4 w-4" /></span>
                <span><strong className="block text-sea-800">{title}</strong><span className="text-muted">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <JoinForm />
      </div>
    </section>
  );
}
