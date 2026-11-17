'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check } from '@/components/Icons';
import { api, errorMessage } from '@/services/api';
import { formatDateTime, formatDay, formatLbp, formatUsd } from '@/lib/format';
import type { StatusKey, TrackedOrder } from '@/types';

const FLOW: { key: StatusKey; label: string }[] = [
  { key: 'booked', label: 'Booked' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'priced', label: 'Priced – awaiting payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function TrackForm() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setPhone(localStorage.getItem('10xmom-phone') ?? '');
    } catch {
      // storage unavailable
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setOrder(await api<TrackedOrder>('/track', { query: { code: code.trim(), phone } }));
    } catch (err) {
      setOrder(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reached = (key: StatusKey) => order && FLOW.findIndex((f) => f.key === key) <= FLOW.findIndex((f) => f.key === order.status);
  const eventTime = (key: StatusKey) => order?.events.findLast((e) => e.status === key)?.createdAt;

  return (
    <>
      <form onSubmit={submit} className="card grid gap-x-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="field">
          <label htmlFor="t-code">Order code</label>
          <input id="t-code" className="input uppercase" placeholder="10X-XXXXXX" maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="t-phone">WhatsApp number</label>
          <input id="t-phone" className="input" type="tel" inputMode="tel" placeholder="03 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary mb-4" disabled={busy}>{busy ? 'Checking…' : 'Track'}</button>
      </form>

      <div aria-live="polite" className="mt-6">
        {error && <p className="form-error">{error}</p>}
        {order && (
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-muted">Order {order.code}</p>
                <h2 className="text-2xl">Hi {order.firstName}, your order is {order.statusLabel.toLowerCase()}.</h2>
              </div>
              {order.serviceLevel === 'EXPRESS' && <span className="rounded-full bg-saffron-100 px-3 py-1 text-xs font-bold text-saffron-700">Express</span>}
            </div>
            <p className="mt-2 text-muted">
              Pickup {formatDay(order.pickupDate, { weekday: 'long', day: 'numeric', month: 'long' })}, {order.pickupSlot} · {order.area}
              {order.momName && <> · with {order.momName}</>}
            </p>

            {order.status === 'cancelled' ? (
              <p className="form-error mt-5">This order was cancelled.</p>
            ) : (
              <ol className="mt-6 space-y-3">
                {FLOW.map(({ key, label }) => {
                  const done = reached(key);
                  const at = eventTime(key);
                  return (
                    <li key={key} className={`flex items-center gap-3 ${done ? 'text-sea-800' : 'text-muted/60'}`}>
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${order.status === key ? 'bg-clay-600 text-white' : done ? 'bg-sea-600 text-white' : 'border-2 border-line'}`}>
                        {done && <Check className="h-4 w-4" />}
                      </span>
                      <span className={order.status === key ? 'font-bold' : ''}>{label}</span>
                      {at && <span className="ml-auto text-sm text-muted">{formatDateTime(at)}</span>}
                    </li>
                  );
                })}
              </ol>
            )}

            {order.items.length > 0 && (
              <details className="mt-6 rounded-xl bg-linen p-4">
                <summary className="cursor-pointer font-bold text-sea-700">Items ({order.items.reduce((n, i) => n + i.qty, 0)})</summary>
                <ul className="mt-2 space-y-1 text-sm">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{formatLbp(i.qty * i.unitLbp)}</span></li>
                  ))}
                </ul>
                {order.estimateUsd != null && <p className="mt-2 text-sm text-muted">Estimate at booking: {formatUsd(order.estimateUsd)}</p>}
              </details>
            )}

            {order.priceUsd != null && (
              <div className="mt-6 space-y-1 border-t border-line pt-4">
                <p className="flex justify-between"><span>Final price</span><strong>{formatUsd(order.priceUsd)}</strong></p>
                {order.giftAppliedUsd > 0 && <p className="flex justify-between text-sea-600"><span>Gift card</span><span>− {formatUsd(order.giftAppliedUsd)}</span></p>}
                <p className="flex justify-between text-lg"><span className="font-bold">To pay</span><strong className="text-clay-700">{formatUsd(order.amountDueUsd)}</strong></p>
              </div>
            )}
            {order.paymentLink && (
              <a className="btn btn-primary mt-5 w-full" href={order.paymentLink} target="_blank" rel="noopener noreferrer">Pay {formatUsd(order.amountDueUsd)} with Whish</a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
