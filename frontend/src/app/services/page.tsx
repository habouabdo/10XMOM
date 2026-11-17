import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero, SectionHead } from '@/components/SectionHead';
import { ServiceGrid } from '@/components/ServiceGrid';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AUDIENCES } from '@/lib/services';
import { getCatalog } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Our services',
  description: 'Wash & fold, dry cleaning, ironing, bedding, curtains, alterations and carpet cleaning, picked up and delivered across Lebanon. For homes and businesses.',
};

export default async function ServicesPage() {
  const { categories } = await getCatalog();

  return (
    <>
      <PageHero
        eyebrow="Our services"
        title="Care for every piece you own"
        lead="Mix and match services in one order. Tell us what you are sending when you book, and your Mom takes care of the rest."
      />

      <section className="py-16">
        <div className="wrap">
          <ServiceGrid categories={categories} />
        </div>
      </section>

      <section className="bg-sand py-20">
        <div className="wrap">
          <SectionHead eyebrow="Who we serve" title="For homes, and for businesses too" lead="Whether it is one family's laundry or a guesthouse's linen, the same Mom-level care applies." />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map(({ title, text, icon: Icon, business }) => (
              <li key={title} className="card" id={business && title.startsWith('Salons') ? 'business' : undefined}>
                <span className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${business ? 'bg-sea-50 text-sea-600' : 'bg-clay-50 text-clay-600'}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
                {business && <p className="mt-3 text-sm font-bold text-sea-600">Regular pickups · business quotes</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20">
        <div className="wrap grid items-center gap-8 rounded-[2rem] bg-sea-700 p-8 text-white sm:p-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl text-white">Running a business?</h2>
            <p className="mt-3 text-sea-100">
              Salons, clinics, Airbnbs, restaurants and schools: tell us what you need washed and how often, and we will send you a quote with regular pickup times.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <WhatsAppButton text="Hi 10x MoM! I'd like a business laundry quote." label="Get a business quote" />
            <Link href="/contact" className="btn btn-light">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
