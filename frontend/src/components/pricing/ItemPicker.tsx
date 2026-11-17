'use client';

import { useMemo, useState } from 'react';
import { formatLbp, formatUsd, lbpToUsd } from '@/lib/format';
import { categoryInfo } from '@/lib/services';
import type { Basket, CatalogCategory } from '@/types';

interface Props {
  categories: CatalogCategory[];
  basket: Basket;
  onChange: (basket: Basket) => void;
  rate: number;
  initialCategory?: string;
}

/** Category tabs + search + quantity steppers over the price list. Shared by the calculator and the booking form. */
export function ItemPicker({ categories, basket, onChange, rate, initialCategory }: Props) {
  const [active, setActive] = useState(initialCategory && categories.some((c) => c.name === initialCategory) ? initialCategory : categories[0]?.name);
  const [search, setSearch] = useState('');

  const setQty = (id: number, qty: number) => {
    const next = { ...basket };
    if (qty <= 0) delete next[id];
    else next[id] = Math.min(99, qty);
    onChange(next);
  };

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories.find((c) => c.name === active)?.groups ?? [];
    // Searching looks across every category.
    return categories
      .flatMap((c) => c.groups.map((g) => ({ name: `${c.name}${g.name ? ` · ${g.name}` : ''}`, items: g.items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(term)) })))
      .filter((g) => g.items.length);
  }, [categories, active, search]);

  const countIn = (cat: CatalogCategory) => cat.groups.flatMap((g) => g.items).reduce((n, i) => n + (basket[i.id] ?? 0), 0);

  if (!categories.length) {
    return <p className="form-error">The price list is not available right now. Please try again shortly.</p>;
  }

  return (
    <div>
      <label className="sr-only" htmlFor="item-search">Search items</label>
      <input
        id="item-search"
        type="search"
        className="input mb-4"
        placeholder="Search: shirt, duvet, curtain, zip…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {!search && (
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Service categories">
          {categories.map((cat) => {
            const Icon = categoryInfo(cat.name)?.icon;
            const n = countIn(cat);
            return (
              <button
                key={cat.name}
                type="button"
                role="tab"
                aria-selected={active === cat.name}
                aria-pressed={active === cat.name}
                className="chip inline-flex shrink-0 items-center gap-2"
                onClick={() => setActive(cat.name)}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {cat.name}
                {n > 0 && <span className="rounded-full bg-saffron-400 px-2 text-xs text-sea-900">{n}</span>}
              </button>
            );
          })}
        </div>
      )}

      {groups.length === 0 && <p className="text-muted">No items match “{search}”.</p>}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.name ?? 'all'}>
            {group.name && <h3 className="mb-2 text-sm font-extrabold tracking-wide text-muted uppercase">{group.name}</h3>}
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {group.items.map((item) => {
                const qty = basket[item.id] ?? 0;
                return (
                  <li key={item.id} className={`flex items-center gap-3 p-3 sm:p-4 ${qty ? 'bg-clay-50/60' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sea-800">{item.name}</p>
                      <p className="text-sm text-muted">{item.description}</p>
                      <p className="mt-1 text-sm">
                        <span className="font-bold text-clay-700">{formatLbp(item.priceLbp)}</span>
                        <span className="text-muted"> ≈ {formatUsd(lbpToUsd(item.priceLbp, rate))} · {item.unit.toLowerCase()}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Quantity of ${item.name}`}>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full border border-line text-xl font-bold text-sea-700 disabled:opacity-30"
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={!qty}
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-extrabold tabular-nums" aria-live="polite">{qty}</span>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full bg-sea-600 text-xl font-bold text-white disabled:opacity-30"
                        onClick={() => setQty(item.id, qty + 1)}
                        disabled={qty >= 99}
                        aria-label={`Add one ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
