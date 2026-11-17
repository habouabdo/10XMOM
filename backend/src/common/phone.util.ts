import { BadRequestException } from '@nestjs/common';

// Stores Lebanese numbers as 961XXXXXXXX so they work directly in wa.me links.
export function normalizePhone(value: unknown, field = 'Phone number'): string {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('961')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^\d{7,8}$/.test(digits)) {
    throw new BadRequestException(`${field} must be a valid Lebanese number, e.g. 03 123 456 or 71 123 456.`);
  }
  return `961${digits}`;
}
