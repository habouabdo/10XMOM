import Link from 'next/link';
import { Heart } from './Icons';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="10x MoM home"
      className={`inline-flex items-center font-display text-2xl font-bold tracking-tight no-underline ${light ? 'text-white' : 'text-sea-700'}`}
    >
      <span className="mr-1.5 rounded-lg bg-clay-600 px-1.5 py-0.5 text-lg text-white">10x</span>
      M<Heart className="mx-px h-5 w-5 text-clay-500" />M
    </Link>
  );
}
