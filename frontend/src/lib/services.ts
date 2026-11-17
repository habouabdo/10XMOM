import type { ComponentType, SVGProps } from 'react';
import { Ball, Basket, Bed, Building, Home, Iron, Key, Needle, Rug, Sparkle, Suit } from '@/components/Icons';
import type { CatalogCategory } from '@/types';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** Display info for each price-list category (names must match the `category` column of the price list). */
export const SERVICE_CATEGORIES: { category: string; slug: string; title: string; blurb: string; icon: Icon }[] = [
  { category: 'Bundles', slug: 'bundles', title: 'Wash & fold bundles', blurb: 'The weekly family load by the bag, plus sneaker care and bed & bath refresh packs.', icon: Basket },
  { category: 'Dry Cleaning', slug: 'dry-cleaning', title: 'Dry cleaning', blurb: 'Shirts, dresses, suits, coats and accessories cleaned to the care label.', icon: Suit },
  { category: 'Pressing', slug: 'pressing', title: 'Ironing & pressing', blurb: 'Crisp shirts, trousers and bed linen, steam-pressed and ready to wear.', icon: Iron },
  { category: 'Household', slug: 'household', title: 'Bedding, towels & curtains', blurb: 'Duvets, sheets, towels, sofa covers and curtains: the bulky things.', icon: Bed },
  { category: 'Alterations', slug: 'alterations', title: 'Repairs & alterations', blurb: 'Hems, zips, waist and sleeve adjustments, and small repairs.', icon: Needle },
  { category: 'Carpets', slug: 'carpets', title: 'Carpet cleaning', blurb: 'Regular, Aajami and silk carpets, priced per square metre.', icon: Rug },
];

export const AUDIENCES: { title: string; text: string; icon: Icon; business?: boolean }[] = [
  { title: 'Homes & families', text: 'Weekly loads, school uniforms and bedding, so evenings are for family, not the laundry basket.', icon: Home },
  { title: 'New mums & busy parents', text: 'Baby clothes washed gently with care, collected from your door when it suits you.', icon: Sparkle },
  { title: 'Salons, clinics & gyms', text: 'Towels, gowns and uniforms collected on a schedule that fits your opening hours.', icon: Building, business: true },
  { title: 'Airbnb & guesthouses', text: 'Fresh sheets and towels between guests, with quick turnarounds for busy weekends.', icon: Key, business: true },
  { title: 'Restaurants & events', text: 'Tablecloths, napkins and staff uniforms cleaned and pressed for service.', icon: Suit, business: true },
  { title: 'Schools & sports teams', text: 'Kits, uniforms and costumes washed in bulk and returned sorted.', icon: Ball, business: true },
];

export const categoryInfo = (name: string) => SERVICE_CATEGORIES.find((c) => c.category === name);

/** Lowest active price in a category, for "from LBP …" labels. */
export function fromPrice(categories: CatalogCategory[], name: string): number | null {
  const items = categories.find((c) => c.name === name)?.groups.flatMap((g) => g.items) ?? [];
  return items.length ? Math.min(...items.map((i) => i.priceLbp)) : null;
}
