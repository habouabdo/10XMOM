'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="narrow py-24 text-center">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="lead mt-4">Please try again. If it keeps happening, message us on WhatsApp.</p>
      <button type="button" className="btn btn-primary mt-8" onClick={reset}>Try again</button>
    </section>
  );
}
