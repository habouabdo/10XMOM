import { computeQuote } from '../src/catalog/quote';
import { normalizePhone } from '../src/common/phone.util';
import { isSlotOpen } from '../src/common/time.util';

const base = {
  rate: 89500,
  deliveryUsd: 5,
  expressMultiplier: 2,
  firstOrderDiscountPercent: 15,
  lines: [
    { id: 1, name: 'Wash & Fold — Bag 7kg', unit: 'Per bag', qty: 1, unitLbp: 1_350_000 },
    { id: 2, name: 'Shirt', unit: 'Per item', qty: 4, unitLbp: 250_000 },
  ],
};

describe('computeQuote', () => {
  it('adds items and flat pickup & delivery', () => {
    const q = computeQuote({ ...base, serviceLevel: 'STANDARD', firstOrder: false });
    expect(q.subtotalLbp).toBe(2_350_000);
    expect(q.deliveryLbp).toBe(447_500);
    expect(q.totalLbp).toBe(2_797_500);
    expect(q.totalUsd).toBe(31.26);
  });

  it('doubles item prices for express but not delivery', () => {
    const q = computeQuote({ ...base, serviceLevel: 'EXPRESS', firstOrder: false });
    expect(q.expressSurchargeLbp).toBe(2_350_000);
    expect(q.totalLbp).toBe(2_350_000 * 2 + 447_500);
  });

  it('applies the first-order discount to items only', () => {
    const q = computeQuote({ ...base, serviceLevel: 'STANDARD', firstOrder: true });
    expect(q.discountLbp).toBe(352_500);
    expect(q.totalLbp).toBe(2_350_000 - 352_500 + 447_500);
  });

  it('charges nothing for an empty basket', () => {
    const q = computeQuote({ ...base, lines: [], serviceLevel: 'STANDARD', firstOrder: true });
    expect(q.totalLbp).toBe(0);
  });
});

describe('normalizePhone', () => {
  it.each(['03 123 456', '+961 3 123 456', '0096171123456', '71123456'])('accepts %s', (input) => {
    expect(normalizePhone(input)).toMatch(/^961\d{7,8}$/);
  });
  it('rejects short numbers', () => {
    expect(() => normalizePhone('12345')).toThrow();
  });
});

describe('isSlotOpen', () => {
  const now = { date: '2026-11-16', minutes: 10 * 60 };
  it('needs an hour of notice today', () => {
    expect(isSlotOpen('2026-11-16', '11:00-13:00', now)).toBe(true);
    expect(isSlotOpen('2026-11-16', '10:30-12:00', now)).toBe(false);
  });
  it('rejects past days and days beyond the booking window', () => {
    expect(isSlotOpen('2026-11-15', '11:00-13:00', now)).toBe(false);
    expect(isSlotOpen('2026-12-01', '11:00-13:00', now)).toBe(false);
    expect(isSlotOpen('2026-11-30', '11:00-13:00', now)).toBe(true);
  });
});
