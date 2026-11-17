import type { Metadata } from 'next';
import { BookingForm } from './BookingForm';
import { getCatalog } from '@/services/server-api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Book a pickup',
  description: 'Book a laundry pickup in under two minutes: choose your Mom, a pickup time and what you are sending. Nothing to pay until your order is priced.',
};

export default async function BookPage() {
  const { categories } = await getCatalog();
  return (
    <section className="bg-gradient-to-b from-sand to-linen py-12">
      <div className="wrap">
        <span className="eyebrow">Book a pickup</span>
        <h1 className="text-4xl">Let&apos;s get your laundry sorted</h1>
        <p className="lead mt-2">Takes under two minutes. Nothing to pay until your order is checked and priced.</p>
        <BookingForm initialCategories={categories} />
      </div>
    </section>
  );
}
