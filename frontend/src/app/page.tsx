import Link from 'next/link';
import { Calculator, Chat, Check, Gift, Heart, Shield, Truck } from '@/components/Icons';
import { SectionHead } from '@/components/SectionHead';
import { ServiceGrid } from '@/components/ServiceGrid';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { getCatalog } from '@/services/server-api';

export const revalidate = 300;

const STEPS = [
  { title: 'Book & choose your Mom', text: 'Pick your area, choose a Mom who covers it and select a pickup time.' },
  { title: 'We pick up', text: 'Your Mom collects your clothes, dresses and bedding from your door.' },
  { title: 'We confirm the price', text: 'After checking your items we send the final price and a Whish link on WhatsApp.' },
  { title: 'Pay & get it back', text: 'Pay with Whish and your fresh, folded clothes come back to your door.' },
];

const WHY = [
  { icon: Heart, title: 'You choose who handles your clothes', text: 'See the Moms covering your area and book the one you like.' },
  { icon: Calculator, title: 'Prices you can see before you book', text: 'Every item has a published price. Use the calculator to know your total in advance.' },
  { icon: Shield, title: 'Pay only once we have checked your items', text: 'A secure Whish link on WhatsApp. No cash needed at the door.' },
  { icon: Chat, title: 'Updates on WhatsApp', text: 'Know when we pick up, when it is priced and when it is on the way.' },
];

export default async function HomePage() {
  const { categories } = await getCatalog();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sand via-linen to-clay-50">
        <div aria-hidden className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-sea-100/70" />
        <div className="wrap relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="eyebrow">Laundry pickup &amp; delivery · Lebanon</span>
            <h1 className="text-4xl sm:text-6xl">
              Laundry day? <br />Leave it to <span className="text-clay-600">Mom</span>.
            </h1>
            <p className="lead mt-5 max-w-xl">
              Choose the Mom you trust, pick a time, and we collect your clothes from your door. Washed, ironed and folded with care, then brought back to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-primary">Book a pickup</Link>
              <Link href="/pricing" className="btn btn-ghost">Calculate my price</Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm font-semibold text-sea-700 sm:grid-cols-3">
              {['Choose your own Mom', 'Standard or next-day', 'Pay with Whish'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check className="h-5 w-5 text-clay-600" />{t}</li>
              ))}
            </ul>
          </div>

          {/* Order card illustration */}
          <div aria-hidden className="relative mx-auto w-full max-w-sm">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-3xl bg-saffron-300" />
            <div className="card relative rotate-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted">Order 10X-7KQ2PM</span>
                <span className="rounded-full bg-saffron-100 px-3 py-1 text-xs font-bold text-saffron-700">On the way</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sea-600 font-display text-lg text-white">R</span>
                <div><p className="font-bold text-sea-800">Mom Rita</p><p className="text-sm text-muted">Achrafieh · picked up Tue 11:00</p></div>
              </div>
              <ol className="mt-5 space-y-2 text-sm">
                {['Booked', 'Picked up', 'Priced on WhatsApp', 'Paid with Whish'].map((s) => (
                  <li key={s} className="flex items-center gap-2 text-muted"><Check className="h-4 w-4 text-sea-500" />{s}</li>
                ))}
                <li className="flex items-center gap-2 font-bold text-clay-700"><Truck className="h-4 w-4" />Out for delivery</li>
              </ol>
              <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
                <span className="text-muted">Total</span><span className="font-bold text-sea-800">LBP 1,611,000 · Paid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sea-700 py-20 text-sea-50">
        <div className="wrap">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="text-3xl text-white sm:text-4xl">Four easy steps, zero laundry stress</h2>
          </div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-[var(--radius-card)] bg-sea-600/60 p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron-400 font-display text-lg font-bold text-sea-900">{i + 1}</span>
                <h3 className="mt-4 text-xl text-white">{step.title}</h3>
                <p className="mt-2 text-sea-100">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href="/how-it-works" className="btn btn-light">More about how it works</Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="wrap">
          <SectionHead eyebrow="Our services" title="Everything your wardrobe and home need" lead="From the weekly family load to the dress you wear once a year. Tap a service to see every price." />
          <ServiceGrid categories={categories} />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/services" className="btn btn-ghost">All services</Link>
            <Link href="/services#business" className="btn btn-ghost">Laundry for businesses</Link>
          </div>
        </div>
      </section>

      {/* Calculator teaser */}
      <section className="pb-20">
        <div className="wrap">
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-saffron-100 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <span className="eyebrow bg-white">Price calculator</span>
              <h2 className="text-3xl sm:text-4xl">Know your total before we knock</h2>
              <p className="lead mt-4">Add your shirts, duvets and curtains, choose standard or next-day, and see your estimate in Lebanese pounds and dollars.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/pricing" className="btn btn-primary"><Calculator className="h-5 w-5" /> Open the calculator</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="bg-sand py-20">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionHead eyebrow="Why 10x MoM" title="Care like at home, ten times easier" lead="Every order is handled by a real Mom from your area who treats your clothes like her own family's." />
          <ul className="grid gap-5 sm:grid-cols-2">
            {WHY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card">
                <Icon className="h-7 w-7 text-clay-600" />
                <h3 className="mt-3 text-lg">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Gift cards + join */}
      <section className="py-20">
        <div className="wrap grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col justify-between rounded-[2rem] bg-clay-600 p-8 text-white sm:p-10">
            <div>
              <Gift className="h-10 w-10 text-saffron-300" />
              <h2 className="mt-4 text-3xl text-white">Give the gift of time</h2>
              <p className="mt-3 text-clay-50">A 10x MoM gift card is perfect for new mums, busy families, Mother&apos;s Day or a friend who needs a break.</p>
            </div>
            <Link href="/gift-cards" className="btn btn-light mt-8 self-start">Buy a gift card</Link>
          </div>
          <div className="flex flex-col justify-between rounded-[2rem] bg-sea-600 p-8 text-white sm:p-10">
            <div>
              <Heart className="h-10 w-10 text-saffron-300" />
              <h2 className="mt-4 text-3xl text-white">Are you a Mom who loves fresh laundry?</h2>
              <p className="mt-3 text-sea-100">Join 10x MoM, work flexible hours in your own area and earn from what you are already great at.</p>
            </div>
            <Link href="/join" className="btn btn-light mt-8 self-start">Become a Mom</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <div className="narrow text-center">
          <h2 className="text-3xl sm:text-4xl">Ready for a laundry-free week?</h2>
          <p className="lead mt-4">Book in under two minutes. Nothing to pay until your order is checked and priced.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/book" className="btn btn-primary">Book a pickup</Link>
            <WhatsAppButton text="Hi 10x MoM! I have a question about your laundry service." label="Ask on WhatsApp" />
          </div>
        </div>
      </section>
    </>
  );
}
