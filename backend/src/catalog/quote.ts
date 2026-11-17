import { round2 } from '../common/money';

export type ServiceLevelName = 'STANDARD' | 'EXPRESS';

export interface QuoteInput {
  lines: { id: number; name: string; unit: string; qty: number; unitLbp: number }[];
  serviceLevel: ServiceLevelName;
  firstOrder: boolean;
  rate: number; // LBP per 1 USD
  deliveryUsd: number;
  expressMultiplier: number;
  firstOrderDiscountPercent: number;
}

export interface Quote {
  lines: (QuoteInput['lines'][number] & { lineLbp: number })[];
  serviceLevel: ServiceLevelName;
  subtotalLbp: number;
  expressSurchargeLbp: number;
  discountLbp: number;
  discountPercent: number;
  deliveryLbp: number;
  deliveryUsd: number;
  totalLbp: number;
  totalUsd: number;
  rate: number;
}

// Item prices are LBP. Express costs `expressMultiplier` times the item price (pickup & delivery is not multiplied).
// The first-order discount applies to the items (including the express surcharge), not to pickup & delivery.
export function computeQuote(input: QuoteInput): Quote {
  const lines = input.lines.map((l) => ({ ...l, lineLbp: l.unitLbp * l.qty }));
  const subtotalLbp = lines.reduce((sum, l) => sum + l.lineLbp, 0);
  const expressSurchargeLbp = input.serviceLevel === 'EXPRESS' ? Math.round(subtotalLbp * (input.expressMultiplier - 1)) : 0;
  const discountPercent = input.firstOrder ? input.firstOrderDiscountPercent : 0;
  const discountLbp = Math.round(((subtotalLbp + expressSurchargeLbp) * discountPercent) / 100);
  const deliveryLbp = subtotalLbp > 0 ? Math.round(input.deliveryUsd * input.rate) : 0;
  const totalLbp = subtotalLbp + expressSurchargeLbp - discountLbp + deliveryLbp;
  return {
    lines,
    serviceLevel: input.serviceLevel,
    subtotalLbp,
    expressSurchargeLbp,
    discountLbp,
    discountPercent,
    deliveryLbp,
    deliveryUsd: subtotalLbp > 0 ? input.deliveryUsd : 0,
    totalLbp,
    totalUsd: round2(totalLbp / input.rate),
    rate: input.rate,
  };
}
