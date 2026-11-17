import { formatLbp, formatUsd } from '@/lib/format';
import type { Quote } from '@/types';

export function QuoteSummary({ quote, loading, compact = false }: { quote: Quote | null; loading?: boolean; compact?: boolean }) {
  if (!quote) {
    return <p className="text-sm text-muted">Add items to see your estimate.</p>;
  }
  const rows: [string, number, string?][] = [
    [`Items (${quote.lines.reduce((n, l) => n + l.qty, 0)})`, quote.subtotalLbp],
  ];
  if (quote.expressSurchargeLbp) rows.push(['Express next-day', quote.expressSurchargeLbp]);
  if (quote.discountLbp) rows.push([`First order −${quote.discountPercent}%`, -quote.discountLbp, 'text-sea-600']);
  rows.push([`Pickup & delivery (${formatUsd(quote.deliveryUsd)})`, quote.deliveryLbp]);

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-live="polite">
      {!compact && (
        <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto text-sm">
          {quote.lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3">
              <span className="truncate">{l.qty} × {l.name}</span>
              <span className="shrink-0 tabular-nums">{formatLbp(l.lineLbp)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-1 border-t border-line pt-3 text-sm">
        {rows.map(([label, value, cls]) => (
          <div key={label} className={`flex justify-between gap-3 ${cls ?? ''}`}>
            <dt>{label}</dt>
            <dd className="tabular-nums">{value < 0 ? `− ${formatLbp(-value)}` : formatLbp(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
        <span className="font-bold text-sea-700">Estimated total</span>
        <span className="text-right">
          <span className="block font-display text-2xl font-bold text-clay-700 tabular-nums">{formatLbp(quote.totalLbp)}</span>
          <span className="text-sm text-muted">≈ {formatUsd(quote.totalUsd)}</span>
        </span>
      </div>
    </div>
  );
}
