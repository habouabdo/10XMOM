import Link from 'next/link';
import { formatLbp } from '@/lib/format';
import { SERVICE_CATEGORIES, fromPrice } from '@/lib/services';
import type { CatalogCategory } from '@/types';

export function ServiceGrid({ categories }: { categories: CatalogCategory[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SERVICE_CATEGORIES.map(({ category, slug, title, blurb, icon: Icon }) => {
        const from = fromPrice(categories, category);
        return (
          <Link
            key={slug}
            href={`/pricing?category=${encodeURIComponent(category)}`}
            className="card group flex flex-col text-ink no-underline transition hover:-translate-y-1 hover:border-clay-200"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-clay-50 text-clay-600 transition group-hover:bg-clay-600 group-hover:text-white">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="text-xl">{title}</h3>
            <p className="mt-2 flex-1 text-muted">{blurb}</p>
            <p className="mt-4 text-sm font-bold text-clay-700">
              {from != null ? <>From {formatLbp(from)} →</> : 'See prices →'}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
