'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/services/api';
import { formatDateTime, waLink } from '@/lib/format';
import type { Application } from '@/types';

const STATUSES: Application['status'][] = ['NEW', 'CONTACTED', 'HIRED', 'REJECTED'];

export function ApplicationsTab() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ applications: Application[] }>('/admin/applications').then((r) => setApps(r.applications)).catch((e) => setError(errorMessage(e)));
  }, []);

  const setStatus = async (id: number, status: Application['status']) => {
    try {
      await api(`/admin/applications/${id}`, { method: 'PATCH', body: { status } });
      setApps((a) => a && a.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (!apps) return error ? <p className="form-error">{error}</p> : <p className="text-muted">Loading…</p>;
  if (!apps.length) return <p className="text-muted">No applications yet.</p>;

  return (
    <div className="space-y-4">
      {error && <p className="form-error">{error}</p>}
      {apps.map((a) => (
        <article key={a.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-sea-800">{a.name} · {a.area}</p>
              <p className="text-sm text-muted">+{a.phone} · {a.hasCar ? 'Has a car' : 'No car'} · {formatDateTime(a.createdAt)}</p>
            </div>
            <select className="input w-auto py-2" value={a.status} onChange={(e) => setStatus(a.id, e.target.value as Application['status'])} aria-label={`Status for ${a.name}`}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          {a.experience && <p className="mt-2 text-sm">{a.experience}</p>}
          <a className="btn btn-wa btn-sm mt-3" href={waLink(a.phone, `Hi ${a.name.split(' ')[0]}! Thank you for applying to become a 10x MoM Mom.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </article>
      ))}
    </div>
  );
}
