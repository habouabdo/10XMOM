'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useConfig } from '@/hooks/useConfig';
import { api, errorMessage } from '@/services/api';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your full name.').max(80),
  phone: z.string().trim().regex(/^[+\d\s()-]{7,20}$/, 'Enter a valid WhatsApp number, e.g. 03 123 456.'),
  area: z.string().min(1, 'Choose your area.'),
  experience: z.string().max(1000),
  hasCar: z.boolean(),
});
type Form = z.infer<typeof schema>;

export function JoinForm() {
  const { config } = useConfig();
  const [form, setForm] = useState<Form>({ name: '', phone: '', area: '', experience: '', hasCar: false });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setServerError(null);
    setStatus('busy');
    try {
      await api('/applications', { method: 'POST', body: parsed.data });
      setStatus('done');
    } catch (err) {
      setServerError(errorMessage(err));
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return <div className="card self-start"><p className="form-ok" role="status">Thank you! We received your application and will contact you on WhatsApp.</p></div>;
  }

  return (
    <form onSubmit={submit} noValidate className="card self-start">
      <h2 className="mb-5 text-2xl">Apply in two minutes</h2>
      <div className="field">
        <label htmlFor="j-name">Full name</label>
        <input id="j-name" className="input" autoComplete="name" maxLength={80} value={form.name} aria-invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} />
        {errors.name && <p className="text-sm text-clay-700">{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor="j-phone">WhatsApp number</label>
        <input id="j-phone" className="input" type="tel" inputMode="tel" placeholder="03 123 456" value={form.phone} aria-invalid={!!errors.phone} onChange={(e) => set('phone', e.target.value)} />
        {errors.phone && <p className="text-sm text-clay-700">{errors.phone}</p>}
      </div>
      <div className="field">
        <label htmlFor="j-area">Your area</label>
        <select id="j-area" className="input" value={form.area} aria-invalid={!!errors.area} onChange={(e) => set('area', e.target.value)}>
          <option value="">Choose your area…</option>
          {config?.areas.map((a) => <option key={a}>{a}</option>)}
        </select>
        {errors.area && <p className="text-sm text-clay-700">{errors.area}</p>}
      </div>
      <div className="field">
        <label htmlFor="j-exp">Tell us about you <span className="hint">(optional)</span></label>
        <textarea id="j-exp" className="input min-h-28" maxLength={1000} placeholder="Your laundry experience, available days, equipment at home…" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
      </div>
      <label className="mb-5 flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-clay-600" checked={form.hasCar} onChange={(e) => set('hasCar', e.target.checked)} />
        I have a car for pickups and deliveries
      </label>
      {serverError && <p className="form-error mb-4" role="alert">{serverError}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={status === 'busy'}>{status === 'busy' ? 'Sending…' : 'Send application'}</button>
    </form>
  );
}
