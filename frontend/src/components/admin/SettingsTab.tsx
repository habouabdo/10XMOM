'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import type { AdminSettings } from '@/types';

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export function SettingsTab({ canEdit }: { canEdit: boolean }) {
  const [s, setS] = useState<AdminSettings | null>(null);
  const [areas, setAreas] = useState('');
  const [slots, setSlots] = useState('');
  const [presets, setPresets] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<AdminSettings>('/admin/settings')
      .then((r) => {
        setS(r);
        setAreas(r.areas.join('\n'));
        setSlots(r.slots.join('\n'));
        setPresets(r.gift_card_presets.join(', '));
      })
      .catch((e) => setMsg({ ok: false, text: errorMessage(e) }));
  }, []);

  if (!s) return msg ? <p className="form-error">{msg.text}</p> : <p className="text-muted">Loading…</p>;

  const num = (k: keyof AdminSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) });
  const str = (k: keyof AdminSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const body = {
        areas: lines(areas),
        slots: lines(slots),
        slot_capacity: s.slot_capacity,
        business_whatsapp: s.business_whatsapp,
        business_email: s.business_email,
        site_url: s.site_url,
        usd_lbp_rate: s.usd_lbp_rate,
        pickup_delivery_fee_usd: s.pickup_delivery_fee_usd,
        express_multiplier: s.express_multiplier,
        first_order_discount_percent: s.first_order_discount_percent,
        gift_card_presets: presets.split(',').map((x) => Number(x.trim())).filter((n) => n > 0),
        gift_card_min_usd: s.gift_card_min_usd,
        gift_card_max_usd: s.gift_card_max_usd,
        gift_card_valid_months: s.gift_card_valid_months,
      };
      setS(await api<AdminSettings>('/admin/settings', { method: 'PUT', body }));
      setMsg({ ok: true, text: 'Settings saved.' });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  const field = (id: string, label: string, input: React.ReactNode) => (
    <div className="field"><label htmlFor={id}>{label}</label>{input}</div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={save} className="card">
        <fieldset disabled={!canEdit}>
          <h2 className="mb-4 text-xl">Business</h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {field('st-wa', 'Business WhatsApp', <input id="st-wa" className="input" value={s.business_whatsapp} onChange={str('business_whatsapp')} />)}
            {field('st-email', 'Business email', <input id="st-email" className="input" type="email" value={s.business_email} onChange={str('business_email')} />)}
            {field('st-url', 'Website address', <input id="st-url" className="input" placeholder="https://" value={s.site_url} onChange={str('site_url')} />)}
            {field('st-cap', 'Pickups per Mom per time slot', <input id="st-cap" className="input" type="number" min={1} max={50} value={s.slot_capacity} onChange={num('slot_capacity')} />)}
          </div>

          <h2 className="mb-4 mt-4 text-xl">Pricing</h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {field('st-rate', 'LBP per 1 USD', <input id="st-rate" className="input" type="number" value={s.usd_lbp_rate} onChange={num('usd_lbp_rate')} />)}
            {field('st-del', 'Pickup & delivery fee (USD)', <input id="st-del" className="input" type="number" step="0.5" value={s.pickup_delivery_fee_usd} onChange={num('pickup_delivery_fee_usd')} />)}
            {field('st-exp', 'Express multiplier', <input id="st-exp" className="input" type="number" step="0.1" value={s.express_multiplier} onChange={num('express_multiplier')} />)}
            {field('st-disc', 'First-order discount (%)', <input id="st-disc" className="input" type="number" value={s.first_order_discount_percent} onChange={num('first_order_discount_percent')} />)}
          </div>

          <h2 className="mb-4 mt-4 text-xl">Gift cards</h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {field('st-pre', 'Preset amounts (USD, comma separated)', <input id="st-pre" className="input" value={presets} onChange={(e) => setPresets(e.target.value)} />)}
            {field('st-valid', 'Valid for (months)', <input id="st-valid" className="input" type="number" value={s.gift_card_valid_months} onChange={num('gift_card_valid_months')} />)}
            {field('st-min', 'Minimum (USD)', <input id="st-min" className="input" type="number" value={s.gift_card_min_usd} onChange={num('gift_card_min_usd')} />)}
            {field('st-max', 'Maximum (USD)', <input id="st-max" className="input" type="number" value={s.gift_card_max_usd} onChange={num('gift_card_max_usd')} />)}
          </div>

          <h2 className="mb-4 mt-4 text-xl">Booking</h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {field('st-areas', 'Service areas (one per line)', <textarea id="st-areas" className="input min-h-48" value={areas} onChange={(e) => setAreas(e.target.value)} />)}
            {field('st-slots', 'Pickup times (one per line, e.g. 09:00-11:00)', <textarea id="st-slots" className="input min-h-48" value={slots} onChange={(e) => setSlots(e.target.value)} />)}
          </div>
          {canEdit && <button type="submit" className="btn btn-primary">Save settings</button>}
          {!canEdit && <p className="text-sm text-muted">Only admins can change settings.</p>}
        </fieldset>
        {msg && <p className={`mt-4 ${msg.ok ? 'form-ok' : 'form-error'}`}>{msg.text}</p>}
      </form>
      <PasswordForm />
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/auth/password', { method: 'POST', body: { current, next } });
      setCurrent('');
      setNext('');
      setMsg({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  return (
    <form onSubmit={submit} className="card self-start">
      <h2 className="mb-4 text-xl">Change password</h2>
      <div className="field"><label htmlFor="pw-cur">Current password</label><input id="pw-cur" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
      <div className="field"><label htmlFor="pw-new">New password (12+ characters)</label><input id="pw-new" className="input" type="password" autoComplete="new-password" minLength={12} value={next} onChange={(e) => setNext(e.target.value)} required /></div>
      <button type="submit" className="btn btn-sea">Change password</button>
      {msg && <p className={`mt-4 ${msg.ok ? 'form-ok' : 'form-error'}`}>{msg.text}</p>}
    </form>
  );
}
