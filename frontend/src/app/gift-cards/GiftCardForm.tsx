'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Heart } from '@/components/Icons';
import { useConfig } from '@/hooks/useConfig';
import { api, errorMessage } from '@/services/api';
import { formatUsd, waLink } from '@/lib/format';

const phone = z.string().trim().regex(/^[+\d\s()-]{7,20}$/, 'Enter a valid WhatsApp number, e.g. 03 123 456.');

const schema = z.object({
  amountUsd: z.number({ invalid_type_error: 'Choose an amount.' }).positive('Choose an amount.'),
  recipientName: z.string().trim().min(1, 'Who is the gift for?').max(80),
  recipientPhone: z.union([z.literal(''), phone]),
  message: z.string().max(300),
  buyerName: z.string().trim().min(1, 'Enter your name.').max(80),
  buyerPhone: phone,
});

type Form = z.input<typeof schema>;
type Errors = Partial<Record<keyof Form, string>>;

export function GiftCardForm() {
  const { config } = useConfig();
  const presets = config?.gift_card_presets ?? [25, 50, 100, 200];
  const [form, setForm] = useState<Form>({ amountUsd: 50, recipientName: '', recipientPhone: '', message: '', buyerName: '', buyerPhone: '' });
  const [custom, setCustom] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; amountUsd: number } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    const min = config?.gift_card_min_usd ?? 10;
    const max = config?.gift_card_max_usd ?? 1000;
    if (form.amountUsd < min || form.amountUsd > max) {
      setErrors({ amountUsd: `Choose an amount between $${min} and $${max}.` });
      return;
    }
    setErrors({});
    setServerError(null);
    setBusy(true);
    try {
      setDone(await api('/gift-cards', { method: 'POST', body: { ...parsed.data, recipientPhone: parsed.data.recipientPhone || undefined } }));
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card mx-auto max-w-xl text-center" role="status">
        <Heart className="mx-auto h-12 w-12 text-clay-600" />
        <h2 className="mt-4 text-3xl">Thank you, {form.buyerName.split(' ')[0]}!</h2>
        <p className="lead mt-2">Your gift card code is</p>
        <p className="my-4 font-display text-4xl font-bold tracking-widest text-clay-700">{done.code}</p>
        <p className="text-muted">
          We will send you a Whish payment link for {formatUsd(done.amountUsd)} on WhatsApp. The card becomes active as soon as it is paid.
        </p>
        {config?.business_whatsapp && (
          <a className="btn btn-wa mt-6" target="_blank" rel="noopener noreferrer"
            href={waLink(config.business_whatsapp, `Hi 10x MoM! I just ordered gift card ${done.code} (${formatUsd(done.amountUsd)}). Please send me the Whish link.`)}>
            Send it to us on WhatsApp now
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <form onSubmit={submit} noValidate className="card">
        <fieldset className="mb-6">
          <legend className="mb-3 font-display text-xl font-semibold text-sea-700">1. Choose an amount</legend>
          <div className="flex flex-wrap gap-2">
            {presets.map((amount) => (
              <button key={amount} type="button" className="chip px-5 py-3 text-base" aria-pressed={!custom && form.amountUsd === amount}
                onClick={() => { setCustom(''); set('amountUsd', amount); }}>
                ${amount}
              </button>
            ))}
            <label className="flex items-center gap-2">
              <span className="sr-only">Custom amount in USD</span>
              <input className="input w-36" inputMode="decimal" placeholder="Other $" value={custom}
                aria-invalid={!!errors.amountUsd}
                onChange={(e) => { setCustom(e.target.value); set('amountUsd', Number(e.target.value)); }} />
            </label>
          </div>
          {errors.amountUsd && <p className="mt-2 text-sm text-clay-700">{errors.amountUsd}</p>}
        </fieldset>

        <fieldset className="mb-2">
          <legend className="mb-3 font-display text-xl font-semibold text-sea-700">2. Who is it for?</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field id="g-rname" label="Their name" error={errors.recipientName}>
              <input id="g-rname" className="input" maxLength={80} value={form.recipientName} aria-invalid={!!errors.recipientName} onChange={(e) => set('recipientName', e.target.value)} />
            </Field>
            <Field id="g-rphone" label={<>Their WhatsApp <span className="hint">(optional)</span></>} error={errors.recipientPhone}>
              <input id="g-rphone" className="input" type="tel" inputMode="tel" placeholder="03 123 456" value={form.recipientPhone} aria-invalid={!!errors.recipientPhone} onChange={(e) => set('recipientPhone', e.target.value)} />
            </Field>
          </div>
          <Field id="g-msg" label={<>Personal message <span className="hint">(optional)</span></>}>
            <textarea id="g-msg" className="input min-h-24" maxLength={300} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Enjoy a week off laundry duty! ♥" />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-display text-xl font-semibold text-sea-700">3. Your details</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field id="g-bname" label="Your name" error={errors.buyerName}>
              <input id="g-bname" className="input" autoComplete="name" maxLength={80} value={form.buyerName} aria-invalid={!!errors.buyerName} onChange={(e) => set('buyerName', e.target.value)} />
            </Field>
            <Field id="g-bphone" label="Your WhatsApp number" error={errors.buyerPhone}>
              <input id="g-bphone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="03 123 456" value={form.buyerPhone} aria-invalid={!!errors.buyerPhone} onChange={(e) => set('buyerPhone', e.target.value)} />
            </Field>
          </div>
        </fieldset>

        {serverError && <p className="form-error mb-4" role="alert">{serverError}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Sending…' : `Order a ${form.amountUsd > 0 ? formatUsd(form.amountUsd) : ''} gift card`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Nothing is charged now. We send a Whish payment link on WhatsApp.</p>
      </form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-24 lg:self-start" aria-hidden>
        <div className="relative aspect-[1.6] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-clay-500 via-clay-600 to-sea-700 p-7 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-saffron-400/40" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-sea-400/30" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="font-display text-xl font-bold">10x M♥M</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wider uppercase">Gift card</span>
            </div>
            <p className="line-clamp-2 text-sm text-clay-50 italic">{form.message || 'Enjoy a week off laundry duty! ♥'}</p>
            <div className="flex items-end justify-between">
              <span><span className="block text-xs text-clay-100">For</span><span className="font-display text-xl">{form.recipientName || 'Someone special'}</span></span>
              <span className="font-display text-4xl font-bold">{form.amountUsd > 0 ? formatUsd(form.amountUsd).replace('.00', '') : '$—'}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-muted">Valid for 12 months on any 10x MoM service.</p>
      </div>
    </div>
  );
}

export function GiftCardBalance() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ balanceUsd: number; expiresAt: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    try {
      setResult(await api('/gift-cards/check', { query: { code: code.trim() } }));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={check} className="card">
      <h2 className="text-2xl">Check a balance</h2>
      <div className="field mt-4">
        <label htmlFor="gc-code">Gift card code</label>
        <input id="gc-code" className="input uppercase" placeholder="GC-XXXXXX" maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <button type="submit" className="btn btn-sea">Check balance</button>
      <div aria-live="polite" className="mt-4">
        {result && (
          <p className="form-ok">
            Balance: {formatUsd(result.balanceUsd)}
            {result.expiresAt && <> · valid until {new Date(result.expiresAt).toLocaleDateString('en-GB')}</>}
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="text-sm text-clay-700">{error}</p>}
    </div>
  );
}
