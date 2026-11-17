import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHero } from '@/components/SectionHead';
import { TrackForm } from './TrackForm';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Follow your 10x MoM laundry order from pickup to delivery with your order code and WhatsApp number.',
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <>
      <PageHero eyebrow="Track order" title="Where are my clothes?" lead="Enter the order code you received when booking and your WhatsApp number." />
      <section className="py-12">
        <div className="narrow">
          <Suspense><TrackForm /></Suspense>
        </div>
      </section>
    </>
  );
}
