import { Prisma } from '@prisma/client';

export const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number | null =>
  value == null ? null : Number(value);

export const round2 = (n: number) => Math.round(n * 100) / 100;
