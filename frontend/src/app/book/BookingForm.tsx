'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Check, Heart } from '@/components/Icons';
import { ItemPicker } from '@/components/pricing/ItemPicker';
import { QuoteSummary } from '@/components/pricing/QuoteSummary';
import { useConfig } from '@/hooks/useConfig';
import { loadBasket, useQuote } from '@/hooks/useQuote';
import { addDays, formatDay, formatUsd, waLink } from '@/lib/format';
import { api, errorMessage } from '@/services/api';
import type { Basket, CatalogCategory, Quote, ServiceLevel } from '@/types';

const STEPS = ['Address', 'Your Mom', 'Pickup time', 'Your items', 'Confirm'] as const;

const phoneRule = z.string().trim().regex(/^[+\d\s()-]{7,20}$/, 'Enter a valid WhatsApp number, e.g. 03 123 456.');

interface Mom { id: number; name: string; bio: string }
interface Slot { slot: string; available: boolean }
interface Booked { code: string; momName: string; pickupDate: string; pickupSlot: string; quote: Quote | null }

export function BookingForm({ initialCategories }: { initialCategories: CatalogCategory[] }) {
  const { config, error: configError } = useConfig();
  const [categories, setCategories] = useState(initialCategories);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // form state
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [momId, setMomId] = useState<number | 'any'>('any');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [basket, setBasket] = useState<Basket>({});
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('STANDARD');
  const [notes, setNotes] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [giftBalance, setGiftBalance] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // remote data
  const [moms, setMoms] = useState<Mom[] | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState<Booked | null>(null);

  const { quote, loading: quoteLoading } = useQuote(basket, serviceLevel, true);
  const itemCount = Object.values(basket).reduce((a, b) => a + b, 0);

  // Items chosen in the price calculator carry over.
  useEffect(() => {
    const saved = loadBasket();
    if (saved) {
      setBasket(saved.basket);
      setServiceLevel(saved.serviceLevel);
    }
    try {
      setPhone(localStorage.getItem('10xmom-phone') ?? '');
      setName(localStorage.getItem('10xmom-name') ?? '');
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    if (!initialCategories.length) api<{ categories: CatalogCategory[] }>('/catalog').then((c) => setCategories(c.categories)).catch(() => {});
  }, [initialCategories.length]);

  useEffect(() => {
    if (!area) return;
    setMoms(null);
    api<{ moms: Mom[] }>('/moms', { query: { area } }).then((r) => setMoms(r.moms)).catch((e) => setServerError(errorMessage(e)));
  }, [area]);

  const days = useMemo(() => (config ? Array.from({ length: config.booking_days + 1 }, (_, i) => addDays(config.today, i)) : []), [config]);

  useEffect(() => {
    if (!area || !date) return;
    setSlots(null);
    api<{ slots: Slot[] }>('/availability', { query: { area, date, momId } })
      .then((r) => {
        setSlots(r.slots);
        if (!r.slots.some((s) => s.slot === slot && s.available)) setSlot('');
      })
      .catch((e) => setServerError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, date, momId]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!area) e.area = 'Choose your area.';
      if (!address.trim()) e.address = 'Enter your address.';
    }
    if (s === 2 && (!date || !slot)) e.slot = 'Choose a pickup day and time.';
    if (s === 3 && !itemCount && !notes.trim()) e.items = 'Add at least one item, or describe your load in the notes.';
    if (s === 4) {
      if (!name.trim()) e.name = 'Enter your name.';
      const p = phoneRule.safeParse(phone);
      if (!p.success) e.phone = p.error.issues[0].message;
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (!validate(step)) return;
    setServerError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const checkGift = async () => {
    setGiftBalance(null);
    setErrors((e) => ({ ...e, gift: '' }));
    try {
      const r = await api<{ balanceUsd: number }>('/gift-cards/check', { query: { code: giftCode.trim() } });
      setGiftBalance(r.balanceUsd);
    } catch (err) {
      setErrors((e) => ({ ...e, gift: errorMessage(err) }));
    }
  };

  const submit = async () => {
    if (!validate(4)) return;
    setBusy(true);
    setServerError(null);
    try {
      const result = await api<Booked>('/orders', {
        method: 'POST',
        body: {
          name, phone, area, address, addressNotes: addressNotes || undefined, notes: notes || undefined,
          items: Object.entries(basket).map(([id, qty]) => ({ id: Number(id), qty })),
          serviceLevel,
          momId: momId === 'any' ? undefined : momId,
          pickupDate: date,
          pickupSlot: slot,
          giftCardCode: giftCode.trim() || undefined,
        },
      });
      try {
        localStorage.setItem('10xmom-phone', phone);
        localStorage.setItem('10xmom-name', name);
        sessionStorage.removeItem('10xmom-basket');
      } catch {
        // storage unavailable
      }
      setBooked(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (configError) return <p className="form-error mt-8">{configError}</p>;
  if (!config) return <div className="card mt-8 h-64 animate-pulse" aria-busy="true" />;

  if (booked) {
    const message = `Hi 10x MoM! I just booked order ${booked.code} for ${formatDay(booked.pickupDate)} ${booked.pickupSlot}.`;
    return (
      <div className="card mx-auto mt-8 max-w-xl text-center" role="status">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sea-600 text-white"><Check className="h-8 w-8" /></span>
        <h2 className="mt-4 text-3xl">You&apos;re booked!</h2>
        <p className="lead mt-2">{booked.momName} will pick up on {formatDay(booked.pickupDate, { weekday: 'long', day: 'numeric', month: 'long' })}, {booked.pickupSlot}.</p>
        <p className="mt-6 text-sm text-muted">Your order code</p>
        <p className="font-display text-4xl font-bold tracking-widest text-clay-700">{booked.code}</p>
        {booked.quote && <p className="mt-3 text-muted">Estimated total: {formatUsd(booked.quote.totalUsd)}{booked.quote.discountLbp > 0 && ' (first-order discount included)'}</p>}
        <p className="mt-4 text-sm text-muted">We&apos;ll send the final price and a Whish payment link on WhatsApp after pickup.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/track?code=${booked.code}`} className="btn btn-primary">Track my order</Link>
          {config.business_whatsapp && <a className="btn btn-wa" href={waLink(config.business_whatsapp, message)} target="_blank" rel="noopener noreferrer">Confirm on WhatsApp</a>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {/* progress */}
        <ol className="mb-6 flex gap-1" aria-label="Booking steps">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-clay-600' : 'bg-line'}`} />
              <span className={`mt-2 hidden text-xs font-bold sm:block ${i === step ? 'text-clay-700' : 'text-muted'}`} aria-current={i === step ? 'step' : undefined}>
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="card">
          <h2 className="mb-5 text-2xl">{STEPS[step]}</h2>

          {step === 0 && (
            <>
              <div className="field">
                <label htmlFor="b-area">Area</label>
                <select id="b-area" className="input" value={area} aria-invalid={!!errors.area} onChange={(e) => { setArea(e.target.value); setMomId('any'); }}>
                  <option value="">Choose your area…</option>
                  {config.areas.map((a) => <option key={a}>{a}</option>)}
                </select>
                {errors.area && <p className="text-sm text-clay-700">{errors.area}</p>}
              </div>
              <div className="field">
                <label htmlFor="b-address">Address</label>
                <input id="b-address" className="input" autoComplete="street-address" maxLength={300} placeholder="Street, building" value={address} aria-invalid={!!errors.address} onChange={(e) => setAddress(e.target.value)} />
                {errors.address && <p className="text-sm text-clay-700">{errors.address}</p>}
              </div>
              <div className="field">
                <label htmlFor="b-notes">Building, floor, landmark <span className="hint">(optional)</span></label>
                <input id="b-notes" className="input" maxLength={200} placeholder="3rd floor, next to the pharmacy" value={addressNotes} onChange={(e) => setAddressNotes(e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-3" role="radiogroup" aria-label="Choose your Mom">
              <MomOption selected={momId === 'any'} onSelect={() => setMomId('any')} name="Any available Mom" bio="Fastest option: we pick whoever is free at your time." />
              {moms === null && <p className="text-muted">Loading Moms in {area}…</p>}
              {moms?.length === 0 && <p className="form-error">No Moms cover {area} yet. Message us on WhatsApp and we&apos;ll arrange it.</p>}
              {moms?.map((m) => <MomOption key={m.id} selected={momId === m.id} onSelect={() => setMomId(m.id)} name={m.name} bio={m.bio} />)}
            </div>
          )}

          {step === 2 && (
            <>
              <p className="mb-2 text-sm font-bold text-sea-700">Day</p>
              <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2">
                {days.map((d) => (
                  <button key={d} type="button" className="chip shrink-0 text-center" aria-pressed={date === d} onClick={() => setDate(d)}>
                    {d === config.today ? 'Today' : formatDay(d)}
                  </button>
                ))}
              </div>
              {date && (
                <>
                  <p className="mb-2 text-sm font-bold text-sea-700">Pickup window</p>
                  {slots === null ? <p className="text-muted">Checking availability…</p> : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((s) => (
                        <button key={s.slot} type="button" className="chip" disabled={!s.available} aria-pressed={slot === s.slot} onClick={() => setSlot(s.slot)}>
                          {s.slot.replace('-', ' – ')}
                        </button>
                      ))}
                    </div>
                  )}
                  {slots && !slots.some((s) => s.available) && <p className="mt-3 text-sm text-muted">No free times on this day. Try another day or “Any available Mom”.</p>}
                </>
              )}
              {errors.slot && <p className="mt-3 text-sm text-clay-700">{errors.slot}</p>}
            </>
          )}

          {step === 3 && (
            <>
              <fieldset className="mb-5">
                <legend className="mb-2 text-sm font-bold text-sea-700">Turnaround</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['STANDARD', 'EXPRESS'] as const).map((level) => (
                    <button key={level} type="button" className="chip text-left" aria-pressed={serviceLevel === level} onClick={() => setServiceLevel(level)}>
                      <span className="block">{level === 'STANDARD' ? 'Standard · within 72h' : 'Express · next day'}</span>
                      <span className="block text-xs font-normal opacity-80">{level === 'STANDARD' ? 'Regular price' : `${config.express_multiplier}× item price`}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <ItemPicker categories={categories} basket={basket} onChange={setBasket} rate={config.usd_lbp_rate} />
              <div className="field mt-6">
                <label htmlFor="b-load">Notes for your Mom <span className="hint">(stains, delicates, “one big bag”, allergies…)</span></label>
                <textarea id="b-load" className="input min-h-24" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              {errors.items && <p className="form-error">{errors.items}</p>}
            </>
          )}

          {step === 4 && (
            <>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <div className="field">
                  <label htmlFor="b-name">Your name</label>
                  <input id="b-name" className="input" autoComplete="name" maxLength={80} value={name} aria-invalid={!!errors.name} onChange={(e) => setName(e.target.value)} />
                  {errors.name && <p className="text-sm text-clay-700">{errors.name}</p>}
                </div>
                <div className="field">
                  <label htmlFor="b-phone">WhatsApp number</label>
                  <input id="b-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="03 123 456" value={phone} aria-invalid={!!errors.phone} onChange={(e) => setPhone(e.target.value)} />
                  {errors.phone && <p className="text-sm text-clay-700">{errors.phone}</p>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="b-gift">Gift card code <span className="hint">(optional)</span></label>
                <div className="flex gap-2">
                  <input id="b-gift" className="input uppercase" placeholder="GC-XXXXXX" maxLength={20} value={giftCode} onChange={(e) => { setGiftCode(e.target.value); setGiftBalance(null); }} />
                  <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={checkGift} disabled={!giftCode.trim()}>Check</button>
                </div>
                {giftBalance != null && <p className="text-sm font-semibold text-sea-600">Balance {formatUsd(giftBalance)} will be deducted when your order is priced.</p>}
                {errors.gift && <p className="text-sm text-clay-700">{errors.gift}</p>}
              </div>
              <dl className="mt-2 grid gap-2 rounded-2xl bg-linen p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Pickup</dt><dd className="font-bold">{formatDay(date)} · {slot}</dd></div>
                <div><dt className="text-muted">Address</dt><dd className="font-bold">{area}, {address}</dd></div>
                <div><dt className="text-muted">Mom</dt><dd className="font-bold">{momId === 'any' ? 'Any available Mom' : moms?.find((m) => m.id === momId)?.name}</dd></div>
                <div><dt className="text-muted">Turnaround</dt><dd className="font-bold">{serviceLevel === 'EXPRESS' ? 'Express, next day' : 'Standard, within 72h'}</dd></div>
              </dl>
            </>
          )}

          {serverError && <p className="form-error mt-4" role="alert">{serverError}</p>}

          <div className="mt-6 flex justify-between gap-3">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={back}>Back</button> : <span />}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={next} disabled={step === 1 && moms === null}>Continue</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</button>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Your estimate">
        <div className="card">
          <h2 className="mb-3 text-xl">Your estimate</h2>
          <QuoteSummary quote={quote} loading={quoteLoading} />
          {quote && quote.discountLbp > 0 && (
            <p className="mt-3 text-xs text-muted">The {quote.discountPercent}% first-order discount applies if this is your first order with this WhatsApp number.</p>
          )}
          <p className="mt-3 text-xs text-muted">Final price confirmed after pickup. Nothing to pay now.</p>
        </div>
      </aside>
    </div>
  );
}

function MomOption({ selected, onSelect, name, bio }: { selected: boolean; onSelect: () => void; name: string; bio: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect}
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition ${selected ? 'border-clay-600 bg-clay-50' : 'border-line bg-white hover:border-sea-300'}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg text-white ${selected ? 'bg-clay-600' : 'bg-sea-600'}`}>
        {name === 'Any available Mom' ? <Heart className="h-5 w-5" /> : name.replace(/^Mom\s+/, '')[0]}
      </span>
      <span><strong className="block text-sea-800">{name}</strong><span className="text-sm text-muted">{bio}</span></span>
    </button>
  );
}
