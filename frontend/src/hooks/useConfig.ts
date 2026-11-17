'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { PublicConfig } from '@/types';

let cached: Promise<PublicConfig> | null = null;

/** Public site config (areas, slots, WhatsApp number, pricing settings). Fetched once per page load. */
export function useConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    cached ??= api<PublicConfig>('/config');
    cached
      .then((c) => alive && setConfig(c))
      .catch((err: Error) => {
        cached = null;
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { config, error };
}
