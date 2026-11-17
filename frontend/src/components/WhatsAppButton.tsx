'use client';

import { useConfig } from '@/hooks/useConfig';
import { waLink } from '@/lib/format';
import { Chat } from './Icons';

/** Renders only once a business WhatsApp number is set in Admin → Settings. */
export function WhatsAppButton({ text = 'Hi 10x MoM!', label = 'WhatsApp us', className = '' }: { text?: string; label?: string; className?: string }) {
  const { config } = useConfig();
  if (!config?.business_whatsapp) return null;
  return (
    <a className={`btn btn-wa ${className}`} href={waLink(config.business_whatsapp, text)} target="_blank" rel="noopener noreferrer">
      <Chat className="h-5 w-5" /> {label}
    </a>
  );
}
