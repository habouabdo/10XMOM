'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useConfig } from '@/hooks/useConfig';
import { saveBasket, useQuote } from '@/hooks/useQuote';
import { formatUsd } from '@/lib/format';
import type { Basket, CatalogCategory, ServiceLevel } from '@/types';
import { ItemPicker } from './ItemPicker';
import { QuoteSummary } from './QuoteSummary';

export function PriceCalculator({ categories, fallbackRate }: { categories: CatalogCategory[]; fallbackRate: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const { config } = useConfig();
  const [basket, setBasket] = useState<Basket>({});
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('STANDARD');
  const [firstOrder, setFirstOrder] = useState(true);
  const { quote, loading, error } = useQuote(basket, serviceLevel, firstOrder);
  const rate = config?.usd_lbp_rate ?? fallbackRate;
  const count = Object.values(basket).reduce((a, b) => a + b, 0);

  const book = () => {
    saveBasket(basket, serviceLevel);
    router.push('/book');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <ItemPicker categories={categories} basket={basket} onChange={setBasket} rate={rate} initialCategory={params.get('category') ?? undefined} />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Your estimate">
        <div className="card">
          <h2 className="mb-4 text-2xl">Your estimate</h2>

          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-bold text-sea-700">Turnaround</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['STANDARD', 'EXPRESS'] as const).map((level) => (
                <button key={level} type="button" className="chip text-left" aria-pressed={serviceLevel === level} onClick={() => setServiceLevel(level)}>
                  <span className="block">{level === 'STANDARD' ? 'Standard' : 'Express'}</span>
                  <span className="block text-xs font-normal opacity-80">
                    {level === 'STANDARD' ? 'Within 72 hours' : `Next day · ${config?.express_multiplier ?? 2}× price`}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mb-5 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-clay-600" checked={firstOrder} onChange={(e) => setFirstOrder(e.target.checked)} />
            First order with us ({config?.first_order_discount_percent ?? 15}% off items)
          </label>

          <QuoteSummary quote={quote} loading={loading} />
          {error && <p className="form-error mt-3">{error}</p>}

          <button type="button" className="btn btn-primary mt-5 w-full" disabled={!count} onClick={book}>
            Book with these items
          </button>
          <p className="mt-3 text-xs text-muted">
            Prices are a guide until your Mom has collected and checked your items. USD at {rate.toLocaleString('en-US')} LBP/$.
            Pickup & delivery is a flat {formatUsd(config?.pickup_delivery_fee_usd ?? 5)} per order.
          </p>
        </div>
      </aside>
    </div>
  );
}
