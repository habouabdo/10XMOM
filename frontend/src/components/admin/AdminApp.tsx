'use client';

import { useEffect, useState } from 'react';
import { ApiError, api, errorMessage } from '@/services/api';
import { ApplicationsTab } from './ApplicationsTab';
import { GiftCardsTab } from './GiftCardsTab';
import { MomsTab } from './MomsTab';
import { OrdersTab } from './OrdersTab';
import { PricesTab } from './PricesTab';
import { SettingsTab } from './SettingsTab';

const TABS = ['Orders', 'Gift cards', 'Moms', 'Applications', 'Prices', 'Settings'] as const;
type Tab = (typeof TABS)[number];

interface Me { email: string; role: 'ADMIN' | 'STAFF' }

export function AdminApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('Orders');

  useEffect(() => {
    api<{ user: Me }>('/auth/me').then((r) => setMe(r.user)).catch(() => setMe(null));
  }, []);

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setMe(null);
  };

  if (me === undefined) return <div className="wrap py-20 text-center text-muted">Loading…</div>;
  if (me === null) return <Login onLogin={setMe} />;

  return (
    <div className="wrap py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Admin</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          {me.email} · {me.role.toLowerCase()}
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </div>
      </div>
      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} aria-pressed={tab === t} className="chip shrink-0" onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'Orders' && <OrdersTab />}
        {tab === 'Gift cards' && <GiftCardsTab />}
        {tab === 'Moms' && <MomsTab canEdit={me.role === 'ADMIN'} />}
        {tab === 'Applications' && <ApplicationsTab />}
        {tab === 'Prices' && <PricesTab canEdit={me.role === 'ADMIN'} />}
        {tab === 'Settings' && <SettingsTab canEdit={me.role === 'ADMIN'} />}
      </div>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ user: Me }>('/auth/login', { method: 'POST', body: { email, password } });
      onLogin(r.user);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Wrong email or password.' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="narrow py-20">
      <form onSubmit={submit} className="card mx-auto max-w-sm">
        <h1 className="mb-5 text-2xl">Admin login</h1>
        <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="a-pass">Password</label><input id="a-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="form-error mb-4" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </div>
  );
}
