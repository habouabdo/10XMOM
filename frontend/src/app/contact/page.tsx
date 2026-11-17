import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/SectionHead';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { getConfig } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to 10x MoM on WhatsApp about your laundry order, business quotes, gift cards or becoming a Mom.',
};

export default async function ContactPage() {
  const config = await getConfig();
  return (
    <>
      <PageHero eyebrow="Contact" title="We're one message away" lead="WhatsApp is the fastest way to reach us about bookings, prices, business quotes or your order." />
      <section className="py-14">
        <div className="wrap grid gap-5 md:grid-cols-3">
          <div className="card">
            <h2 className="text-xl">WhatsApp</h2>
            <p className="mt-2 text-muted">Questions, changes to a pickup, or anything else.</p>
            <div className="mt-4"><WhatsAppButton label="Chat on WhatsApp" /></div>
            {!config?.business_whatsapp && <p className="mt-4 text-sm text-muted">Our WhatsApp number will appear here soon.</p>}
          </div>
          <div className="card">
            <h2 className="text-xl">Business quotes</h2>
            <p className="mt-2 text-muted">Salons, clinics, Airbnbs, restaurants and schools with regular laundry.</p>
            <div className="mt-4"><WhatsAppButton text="Hi 10x MoM! I'd like a business laundry quote." label="Ask for a quote" /></div>
            {config?.business_email && <p className="mt-4 text-sm">Or email <a href={`mailto:${config.business_email}`}>{config.business_email}</a></p>}
          </div>
          <div className="card">
            <h2 className="text-xl">Your order</h2>
            <p className="mt-2 text-muted">Already booked? Check where your clothes are.</p>
            <Link href="/track" className="btn btn-ghost mt-4">Track an order</Link>
          </div>
        </div>
      </section>
    </>
  );
}
