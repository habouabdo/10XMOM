'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Basket, Quote, ServiceLevel } from '@/types';

/** Live price estimate from the API (the backend is the single source of truth for pricing). */
export function useQuote(basket: Basket, serviceLevel: ServiceLevel, firstOrder: boolean) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(basket);

  useEffect(() => {
    const items = Object.entries(basket).filter(([, q]) => q > 0).map(([id, qty]) => ({ id: Number(id), qty }));
    if (!items.length) {
      setQuote(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      api<Quote>('/quotes', { method: 'POST', body: { items, serviceLevel, firstOrder }, signal: controller.signal })
        .then((q) => {
          setQuote(q);
          setError(null);
        })
        .catch((err: Error) => err.name !== 'AbortError' && setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, serviceLevel, firstOrder]);

  return { quote, loading, error };
}

const BASKET_KEY = '10xmom-basket';

export function saveBasket(basket: Basket, serviceLevel: ServiceLevel) {
  try {
    sessionStorage.setItem(BASKET_KEY, JSON.stringify({ basket, serviceLevel }));
  } catch {
    // storage unavailable: the customer can re-add items in the booking form
  }
}

export function loadBasket(): { basket: Basket; serviceLevel: ServiceLevel } | null {
  try {
    const raw = sessionStorage.getItem(BASKET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
