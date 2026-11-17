export interface PublicConfig {
  areas: string[];
  slots: string[];
  business_whatsapp: string;
  business_email: string;
  today: string;
  booking_days: number;
  usd_lbp_rate: number;
  pickup_delivery_fee_usd: number;
  express_multiplier: number;
  first_order_discount_percent: number;
  gift_card_presets: number[];
  gift_card_min_usd: number;
  gift_card_max_usd: number;
}

export interface PriceItem {
  id: number;
  category: string;
  subcategory: string | null;
  name: string;
  description: string;
  priceLbp: number;
  unit: string;
  sortOrder: number;
  active: boolean;
}

export interface CatalogCategory {
  name: string;
  groups: { name: string | null; items: PriceItem[] }[];
}

export type ServiceLevel = 'STANDARD' | 'EXPRESS';

export interface Quote {
  lines: { id: number; name: string; unit: string; qty: number; unitLbp: number; lineLbp: number }[];
  serviceLevel: ServiceLevel;
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

export type Basket = Record<number, number>; // priceItemId -> qty

export type StatusKey = 'booked' | 'picked_up' | 'priced' | 'paid' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem { id: number; name: string; qty: number; unitLbp: number }

export interface TrackedOrder {
  code: string;
  status: StatusKey;
  statusLabel: string;
  firstName: string;
  area: string;
  pickupDate: string;
  pickupSlot: string;
  momName: string | null;
  serviceLevel: ServiceLevel;
  items: OrderItem[];
  estimateUsd: number | null;
  priceUsd: number | null;
  giftAppliedUsd: number;
  amountDueUsd: number | null;
  paymentLink: string;
  events: { status: StatusKey; createdAt: string }[];
}

export interface AdminOrder {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  area: string;
  address: string;
  addressNotes: string;
  items: OrderItem[];
  notes: string;
  serviceLevel: ServiceLevel;
  estimateUsd: number | null;
  momId: number | null;
  momName: string | null;
  pickupDate: string;
  pickupSlot: string;
  status: StatusKey;
  priceUsd: number | null;
  giftCardId: number | null;
  giftAppliedUsd: number;
  paymentLink: string;
  paidAt: string | null;
  createdAt: string;
  events: { status: StatusKey; note: string; createdAt: string }[];
}

export interface AdminMom { id: number; name: string; phone: string; areas: string[]; bio: string; active: boolean; open_orders: number }

export interface Application {
  id: number; name: string; phone: string; area: string; experience: string; hasCar: boolean;
  status: 'NEW' | 'CONTACTED' | 'HIRED' | 'REJECTED'; createdAt: string;
}

export type GiftCardStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'REDEEMED' | 'CANCELLED';

export interface GiftCard {
  id: number; code: string; amountUsd: number; balanceUsd: number; status: GiftCardStatus;
  buyerName: string; buyerPhone: string; recipientName: string; recipientPhone: string; message: string;
  paymentLink: string; paidAt: string | null; expiresAt: string | null; createdAt: string;
}

export type AdminSettings = Omit<PublicConfig, 'today' | 'booking_days'> & {
  slot_capacity: number;
  site_url: string;
  gift_card_valid_months: number;
};
