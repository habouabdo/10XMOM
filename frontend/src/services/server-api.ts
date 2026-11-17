import type { CatalogCategory, PublicConfig } from '@/types';

// Server components call the backend directly. Data is cached for 5 minutes (ISR); if the API is down
// the page still renders with empty data instead of failing.
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const getCatalog = () => get<{ categories: CatalogCategory[] }>('/catalog', { categories: [] });
export const getConfig = () => get<PublicConfig | null>('/config', null);
