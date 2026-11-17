export const formatLbp = (n: number) => `LBP ${Math.round(n).toLocaleString('en-US')}`;

export const formatUsd = (n: number | null | undefined) =>
  n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Approximate USD for a LBP price, rounded to cents. */
export const lbpToUsd = (lbp: number, rate: number) => Math.round((lbp / rate) * 100) / 100;

export function formatDay(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Beirut', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  picked_up: 'Picked up',
  priced: 'Priced – awaiting payment',
  paid: 'Paid',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
