'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import type { AdminMom, AdminSettings } from '@/types';

interface Draft { id?: number; name: string; phone: string; areas: string[]; bio: string; active: boolean }
const EMPTY: Draft = { name: '', phone: '', areas: [], bio: '', active: true };

export function MomsTab({ canEdit }: { canEdit: boolean }) {
  const [moms, setMoms] = useState<AdminMom[] | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ moms: AdminMom[] }>('/admin/moms').then((r) => setMoms(r.moms)).catch((e) => setError(errorMessage(e)));
    api<AdminSettings>('/admin/settings').then((s) => setAreas(s.areas)).catch(() => {});
  }, []);

  const save = async () => {
    if (!draft) return;
    setError(null);
    try {
      const { id, ...body } = draft;
      const r = await api<{ moms: AdminMom[] }>(id ? `/admin/moms/${id}` : '/admin/moms', { method: id ? 'PATCH' : 'POST', body: { ...body, phone: body.phone || undefined } });
      setMoms(r.moms);
      setDraft(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      {canEdit && !draft && <button type="button" className="btn btn-primary mb-5" onClick={() => setDraft({ ...EMPTY })}>Add a Mom</button>}
      {error && <p className="form-error mb-4">{error}</p>}

      {draft && (
        <div className="card mb-6">
          <h2 className="mb-4 text-xl">{draft.id ? `Edit ${draft.name}` : 'New Mom'}</h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <div className="field"><label htmlFor="mom-name">Name</label><input id="mom-name" className="input" maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="mom-phone">WhatsApp</label><input id="mom-phone" className="input" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor="mom-bio">Short bio (shown to customers)</label><input id="mom-bio" className="input" maxLength={300} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></div>
          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-bold text-sea-700">Areas covered</legend>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => {
                const on = draft.areas.includes(a);
                return <button key={a} type="button" className="chip btn-sm" aria-pressed={on} onClick={() => setDraft({ ...draft, areas: on ? draft.areas.filter((x) => x !== a) : [...draft.areas, a] })}>{a}</button>;
              })}
            </div>
          </fieldset>
          <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-clay-600" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active (can receive bookings)</label>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={save}>Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!moms ? <p className="text-muted">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {moms.map((m) => (
            <article key={m.id} className={`card p-5 ${m.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-sea-800">{m.name} {!m.active && <span className="text-xs text-muted">(inactive)</span>}</p>
                  <p className="text-sm text-muted">{m.phone ? `+${m.phone}` : 'No phone'} · {m.open_orders} open orders</p>
                </div>
                {canEdit && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft({ id: m.id, name: m.name, phone: m.phone, areas: m.areas, bio: m.bio, active: m.active })}>Edit</button>}
              </div>
              <p className="mt-2 text-sm">{m.bio}</p>
              <p className="mt-2 text-xs text-muted">{m.areas.join(', ') || 'No areas'}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
