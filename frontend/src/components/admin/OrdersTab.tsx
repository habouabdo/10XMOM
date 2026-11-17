'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import { STATUS_LABELS, formatDateTime, formatDay, formatLbp, formatUsd, waLink } from '@/lib/format';
import type { AdminMom, AdminOrder, StatusKey } from '@/types';

const FILTERS = ['active', 'booked', 'picked_up', 'priced', 'paid', 'out_for_delivery', 'delivered', 'cancelled', 'all'];

const STATUS_STYLE: Record<StatusKey, string> = {
  booked: 'bg-sea-50 text-sea-700',
  picked_up: 'bg-sea-100 text-sea-800',
  priced: 'bg-saffron-100 text-saffron-700',
  paid: 'bg-sea-600 text-white',
  out_for_delivery: 'bg-clay-100 text-clay-800',
  delivered: 'bg-line text-muted',
  cancelled: 'bg-clay-50 text-clay-700 line-through',
};

function customerMessage(o: AdminOrder) {
  const first = o.customerName.split(/\s+/)[0];
  const due = o.priceUsd == null ? null : Math.round((o.priceUsd - o.giftAppliedUsd) * 100) / 100;
  switch (o.status) {
    case 'booked': return `Hi ${first}! Your 10x MoM pickup ${o.code} is confirmed for ${formatDay(o.pickupDate)}, ${o.pickupSlot}. ${o.momName ?? 'Your Mom'} will see you then.`;
    case 'picked_up': return `Hi ${first}, ${o.momName ?? 'your Mom'} has picked up order ${o.code}. We'll send you the price shortly.`;
    case 'priced': return `Hi ${first}, your order ${o.code} comes to ${formatUsd(o.priceUsd)}${o.giftAppliedUsd ? `, minus ${formatUsd(o.giftAppliedUsd)} gift card` : ''}. Please pay ${formatUsd(due)} securely with Whish: ${o.paymentLink}`;
    case 'paid': return `Thank you ${first}! We received your payment for ${o.code}. We'll deliver your clothes soon.`;
    case 'out_for_delivery': return `Hi ${first}, order ${o.code} is on its way to you now!`;
    case 'delivered': return `Hi ${first}, order ${o.code} has been delivered. Thank you for choosing 10x MoM ♥`;
    default: return `Hi ${first}, about your order ${o.code}: `;
  }
}

export function OrdersTab() {
  const [filter, setFilter] = useState('active');
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ orders: AdminOrder[]; counts: Record<string, number> } | null>(null);
  const [moms, setMoms] = useState<AdminMom[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ orders: AdminOrder[]; counts: Record<string, number> }>('/admin/orders', { query: { status: filter, q } })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => {
    api<{ moms: AdminMom[] }>('/admin/moms').then((r) => setMoms(r.moms)).catch(() => {});
  }, []);

  const replace = (order: AdminOrder) => setData((d) => d && { ...d, orders: d.orders.map((o) => (o.id === order.id ? order : o)) });
  const activeCount = data ? Object.entries(data.counts).filter(([k]) => !['delivered', 'cancelled'].includes(k)).reduce((n, [, v]) => n + v, 0) : 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="chip btn-sm" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'active' ? `Active (${activeCount})` : f === 'all' ? 'All' : `${STATUS_LABELS[f]} (${data?.counts[f] ?? 0})`}
          </button>
        ))}
      </div>
      <input className="input mb-5 max-w-md" type="search" placeholder="Search code, name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
      {error && <p className="form-error mb-4">{error}</p>}
      {!data ? <p className="text-muted">Loading…</p> : data.orders.length === 0 ? <p className="text-muted">No orders here.</p> : (
        <div className="space-y-4">
          {data.orders.map((o) => <OrderCard key={o.id} order={o} moms={moms} onSaved={replace} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o, moms, onSaved }: { order: AdminOrder; moms: AdminMom[]; onSaved: (o: AdminOrder) => void }) {
  const [open, setOpen] = useState(false);
  const [momId, setMomId] = useState(o.momId ? String(o.momId) : '');
  const [price, setPrice] = useState(o.priceUsd != null ? String(o.priceUsd) : '');
  const [link, setLink] = useState(o.paymentLink);
  const [status, setStatus] = useState<StatusKey>(o.status);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(o.status);
    setPrice(o.priceUsd != null ? String(o.priceUsd) : '');
    setLink(o.paymentLink);
  }, [o]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { momId: momId ? Number(momId) : null, priceUsd: price === '' ? null : Number(price), paymentLink: link, note: note || undefined };
      if (status !== o.status) body.status = status;
      const r = await api<{ order: AdminOrder }>(`/admin/orders/${o.id}`, { method: 'PATCH', body });
      onSaved(r.order);
      setNote('');
      setMsg({ ok: true, text: `Saved · ${STATUS_LABELS[r.order.status]}` });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-sea-800">
            {o.code} · {o.customerName}
            {o.serviceLevel === 'EXPRESS' && <span className="ml-2 rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-700">Express</span>}
            {o.giftCardId && <span className="ml-2 rounded-full bg-clay-50 px-2 py-0.5 text-xs text-clay-700">Gift card</span>}
          </p>
          <p className="text-sm text-muted">{formatDay(o.pickupDate)} {o.pickupSlot} · {o.area} · {o.momName ?? 'No Mom'} · +{o.phone}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? 'Close' : 'Details & update'}</button>
        <a className="btn btn-wa btn-sm" href={waLink(o.phone, customerMessage(o))} target="_blank" rel="noopener noreferrer">WhatsApp: {STATUS_LABELS[o.status]}</a>
      </div>

      {open && (
        <div className="mt-5 grid gap-6 border-t border-line pt-5 lg:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p><strong>Address:</strong> {o.address}{o.addressNotes && ` (${o.addressNotes})`}</p>
            {o.items.length > 0 && (
              <ul className="rounded-xl bg-linen p-3">
                {o.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{formatLbp(i.qty * i.unitLbp)}</span></li>)}
              </ul>
            )}
            {o.notes && <p><strong>Notes:</strong> {o.notes}</p>}
            {o.estimateUsd != null && <p><strong>Estimate at booking:</strong> {formatUsd(o.estimateUsd)}</p>}
            {o.giftAppliedUsd > 0 && <p><strong>Gift card applied:</strong> {formatUsd(o.giftAppliedUsd)}</p>}
            <details>
              <summary className="cursor-pointer font-bold text-sea-700">History</summary>
              <ul className="mt-2 space-y-1">
                {o.events.map((e, i) => <li key={i}>{formatDateTime(e.createdAt)} · {STATUS_LABELS[e.status]}{e.note && ` – ${e.note}`}</li>)}
              </ul>
            </details>
          </div>
          <div>
            <div className="grid gap-x-3 sm:grid-cols-2">
              <div className="field">
                <label htmlFor={`m-${o.id}`}>Mom</label>
                <select id={`m-${o.id}`} className="input" value={momId} onChange={(e) => setMomId(e.target.value)}>
                  <option value="">No Mom</option>
                  {moms.map((m) => <option key={m.id} value={m.id}>{m.name}{!m.active && ' (inactive)'}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`s-${o.id}`}>Status</label>
                <select id={`s-${o.id}`} className="input" value={status} onChange={(e) => setStatus(e.target.value as StatusKey)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`p-${o.id}`}>Final price (USD)</label>
                <div className="flex gap-2">
                  <input id={`p-${o.id}`} className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
                  {o.estimateUsd != null && <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => setPrice(String(o.estimateUsd))}>Use estimate</button>}
                </div>
              </div>
              <div className="field">
                <label htmlFor={`l-${o.id}`}>Whish payment link</label>
                <input id={`l-${o.id}`} className="input" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor={`n-${o.id}`}>Note for history <span className="hint">(optional)</span></label>
              <input id={`n-${o.id}`} className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <p className="mb-3 text-xs text-muted">Saving a price + Whish link on a booked or picked-up order moves it to “Priced”. A gift card on the order is deducted automatically.</p>
            <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            {msg && <p className={`mt-3 ${msg.ok ? 'form-ok' : 'form-error'}`}>{msg.text}</p>}
          </div>
        </div>
      )}
    </article>
  );
}
