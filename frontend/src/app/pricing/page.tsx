import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Clock, Gift, Truck } from '@/components/Icons';
import { PriceCalculator } from '@/components/pricing/PriceCalculator';
import { PageHero } from '@/components/SectionHead';
import { getCatalog, getConfig } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Pricing & price calculator',
  description: 'Every 10x MoM price in one place: wash & fold, dry cleaning, ironing, bedding, curtains, alterations and carpets. Calculate your total in LBP and USD.',
};

export default async function PricingPage() {
  const [{ categories }, config] = await Promise.all([getCatalog(), getConfig()]);
  const delivery = config?.pickup_delivery_fee_usd ?? 5;
  const discount = config?.first_order_discount_percent ?? 15;

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Clear prices, calculated in seconds"
        lead="Add what you are sending and see your estimate straight away. Your Mom confirms the final price after pickup."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="card flex items-start gap-3 p-4"><Truck className="h-6 w-6 shrink-0 text-clay-600" /><span><strong className="block text-sea-800">${delivery} pickup &amp; delivery</strong><span className="text-sm text-muted">Flat fee, once per order</span></span></li>
          <li className="card flex items-start gap-3 p-4"><Clock className="h-6 w-6 shrink-0 text-clay-600" /><span><strong className="block text-sea-800">Within 72 hours</strong><span className="text-sm text-muted">Or next-day express at {config?.express_multiplier ?? 2}× the item price</span></span></li>
          <li className="card flex items-start gap-3 p-4"><Gift className="h-6 w-6 shrink-0 text-clay-600" /><span><strong className="block text-sea-800">{discount}% off your first order</strong><span className="text-sm text-muted">Applied automatically when you book</span></span></li>
        </ul>
      </PageHero>

      <section className="py-14">
        <div className="wrap">
          <Suspense>
            <PriceCalculator categories={categories} fallbackRate={config?.usd_lbp_rate ?? 89500} />
          </Suspense>
        </div>
      </section>

      <section className="bg-sand py-14">
        <div className="narrow">
          <h2 className="text-2xl">Good to know</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
            <li>Prices are in Lebanese pounds. Dollar amounts are an estimate at today&apos;s rate set by our team.</li>
            <li>These prices are a guide until your Mom has collected and counted your items. Fabric, size and stains can change the final price.</li>
            <li>Carpets are priced per square metre once measured.</li>
            <li>You pay through a secure Whish link on WhatsApp before delivery. Gift cards are deducted automatically.</li>
          </ul>
          <p className="mt-6">Still not sure? <Link href="/contact">Ask us for a quote</Link>.</p>
        </div>
      </section>
    </>
  );
}
