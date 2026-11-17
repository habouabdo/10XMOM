'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import { formatDateTime, formatUsd, waLink } from '@/lib/format';
import type { GiftCard, GiftCardStatus } from '@/types';

const LABELS: Record<GiftCardStatus, string> = { PENDING_PAYMENT: 'Awaiting payment', ACTIVE: 'Active', REDEEMED: 'Used up', CANCELLED: 'Cancelled' };

export function GiftCardsTab() {
  const [cards, setCards] = useState<GiftCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ giftCards: GiftCard[] }>('/admin/gift-cards').then((r) => setCards(r.giftCards)).catch((e) => setError(errorMessage(e)));
  }, []);

  const replace = (card: GiftCard) => setCards((cs) => cs && cs.map((c) => (c.id === card.id ? card : c)));

  if (error) return <p className="form-error">{error}</p>;
  if (!cards) return <p className="text-muted">Loading…</p>;
  if (!cards.length) return <p className="text-muted">No gift cards yet.</p>;
  return <div className="space-y-4">{cards.map((c) => <GiftCardRow key={c.id} card={c} onSaved={replace} />)}</div>;
}

function GiftCardRow({ card: c, onSaved }: { card: GiftCard; onSaved: (c: GiftCard) => void }) {
  const [link, setLink] = useState(c.paymentLink);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = async (body: { status?: GiftCardStatus; paymentLink?: string }) => {
    setMsg(null);
    try {
      onSaved(await api<GiftCard>(`/admin/gift-cards/${c.id}`, { method: 'PATCH', body }));
      setMsg({ ok: true, text: 'Saved.' });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    }
  };

  const buyerFirst = c.buyerName.split(/\s+/)[0];
  const payText = `Hi ${buyerFirst}! Thank you for ordering a ${formatUsd(c.amountUsd)} 10x MoM gift card for ${c.recipientName} (${c.code}). Pay securely with Whish: ${link}`;
  const activeText = `Hi ${buyerFirst}, payment received! Gift card ${c.code} for ${c.recipientName} is now active (${formatUsd(c.amountUsd)}). They can enter the code when booking at 10x MoM.`;
  const recipientText = `Hi ${c.recipientName}! ${c.buyerName} sent you a ${formatUsd(c.amountUsd)} 10x MoM laundry gift card ♥${c.message ? `\n\n"${c.message}"` : ''}\n\nYour code: ${c.code}. Enter it when you book a pickup.`;

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-sea-800">{c.code} · {formatUsd(c.amountUsd)} <span className="font-normal text-muted">(balance {formatUsd(c.balanceUsd)})</span></p>
          <p className="text-sm text-muted">From {c.buyerName} (+{c.buyerPhone}) to {c.recipientName}{c.recipientPhone && ` (+${c.recipientPhone})`} · {formatDateTime(c.createdAt)}</p>
          {c.message && <p className="mt-1 text-sm italic">“{c.message}”</p>}
          {c.expiresAt && <p className="text-xs text-muted">Valid until {new Date(c.expiresAt).toLocaleDateString('en-GB')}</p>}
        </div>
        <span className="rounded-full bg-sea-50 px-3 py-1 text-xs font-bold text-sea-700">{LABELS[c.status]}</span>
      </div>

      {c.status === 'PENDING_PAYMENT' && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="field mb-0 min-w-64 flex-1">
            <label htmlFor={`gl-${c.id}`}>Whish payment link</label>
            <input id={`gl-${c.id}`} className="input" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ paymentLink: link })}>Save link</button>
          {link && <a className="btn btn-wa btn-sm" href={waLink(c.buyerPhone, payText)} target="_blank" rel="noopener noreferrer">Send Whish link</a>}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => update({ status: 'ACTIVE' })}>Mark paid · activate</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => confirm('Cancel this gift card?') && update({ status: 'CANCELLED' })}>Cancel</button>
        </div>
      )}
      {c.status === 'ACTIVE' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="btn btn-wa btn-sm" href={waLink(c.buyerPhone, activeText)} target="_blank" rel="noopener noreferrer">Tell buyer it&apos;s active</a>
          {c.recipientPhone && <a className="btn btn-wa btn-sm" href={waLink(c.recipientPhone, recipientText)} target="_blank" rel="noopener noreferrer">Send to recipient</a>}
        </div>
      )}
      {msg && <p className={`mt-3 ${msg.ok ? 'form-ok' : 'form-error'}`}>{msg.text}</p>}
    </article>
  );
}
