'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import { formatLbp } from '@/lib/format';
import type { PriceItem } from '@/types';

type Draft = Omit<PriceItem, 'id' | 'sortOrder'> & { id?: number };
const EMPTY: Draft = { category: '', subcategory: '', name: '', description: '', priceLbp: 0, unit: 'Per item', active: true };

export function PricesTab({ canEdit }: { canEdit: boolean }) {
  const [items, setItems] = useState<PriceItem[] | null>(null);
  const [filter, setFilter] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PriceItem[]>('/admin/prices').then(setItems).catch((e) => setError(errorMessage(e)));
  }, []);

  const shown = useMemo(() => {
    const t = filter.toLowerCase();
    return (items ?? []).filter((i) => !t || `${i.category} ${i.subcategory ?? ''} ${i.name}`.toLowerCase().includes(t));
  }, [items, filter]);

  const save = async () => {
    if (!draft) return;
    setError(null);
    try {
      const { id, ...body } = draft;
      const saved = await api<PriceItem>(id ? `/admin/prices/${id}` : '/admin/prices', {
        method: id ? 'PUT' : 'POST',
        body: { ...body, subcategory: body.subcategory || undefined, priceLbp: Number(body.priceLbp) },
      });
      setItems((list) => (id ? list!.map((i) => (i.id === id ? saved : i)) : [...(list ?? []), saved]));
      setDraft(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted">Prices are in LBP. The USD estimate shown to customers uses the rate in Settings.</p>
      <div className="mb-5 flex flex-wrap gap-3">
        <input className="input max-w-sm" type="search" placeholder="Filter items" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter price items" />
        {canEdit && <button type="button" className="btn btn-primary" onClick={() => setDraft({ ...EMPTY })}>Add item</button>}
      </div>
      {error && <p className="form-error mb-4">{error}</p>}

      {draft && (
        <div className="card mb-6">
          <div className="grid gap-x-4 sm:grid-cols-3">
            {(['category', 'subcategory', 'name', 'unit'] as const).map((k) => (
              <div key={k} className="field">
                <label htmlFor={`pi-${k}`}>{k[0].toUpperCase() + k.slice(1)}</label>
                <input id={`pi-${k}`} className="input" value={draft[k] ?? ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              </div>
            ))}
            <div className="field">
              <label htmlFor="pi-price">Price (LBP)</label>
              <input id="pi-price" className="input" inputMode="numeric" value={draft.priceLbp} onChange={(e) => setDraft({ ...draft, priceLbp: Number(e.target.value.replace(/\D/g, '')) })} />
            </div>
          </div>
          <div className="field"><label htmlFor="pi-desc">Description</label><input id="pi-desc" className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <label className="mb-4 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-clay-600" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Shown on the website</label>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={save}>Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!items ? <p className="text-muted">Loading…</p> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand text-sea-700">
              <tr><th className="p-3">Category</th><th className="p-3">Item</th><th className="p-3">Unit</th><th className="p-3 text-right">Price</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((i) => (
                <tr key={i.id} className={i.active ? '' : 'opacity-50'}>
                  <td className="p-3 text-muted">{i.category}{i.subcategory && ` · ${i.subcategory}`}</td>
                  <td className="p-3 font-semibold">{i.name}</td>
                  <td className="p-3 text-muted">{i.unit}</td>
                  <td className="p-3 text-right tabular-nums">{formatLbp(i.priceLbp)}</td>
                  <td className="p-3 text-right">{canEdit && <button type="button" className="font-bold text-clay-700" onClick={() => setDraft({ ...i, subcategory: i.subcategory ?? '' })}>Edit</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
