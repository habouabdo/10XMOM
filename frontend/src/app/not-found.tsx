import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="narrow py-24 text-center">
      <span className="eyebrow">404</span>
      <h1 className="text-4xl">This page went missing in the wash</h1>
      <p className="lead mt-4">The page you were looking for doesn&apos;t exist.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/book" className="btn btn-ghost">Book a pickup</Link>
      </div>
    </section>
  );
}
