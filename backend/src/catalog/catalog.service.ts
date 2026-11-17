import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PriceItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { Quote, ServiceLevelName, computeQuote } from './quote';
import { UpsertPriceItemDto } from './catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService, private readonly settings: SettingsService) {}

  /** Public price list grouped as category -> subcategory -> items, in sheet order. */
  async grouped() {
    const items = await this.prisma.priceItem.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    const categories: { name: string; groups: { name: string | null; items: PriceItem[] }[] }[] = [];
    for (const item of items) {
      let category = categories.find((c) => c.name === item.category);
      if (!category) categories.push((category = { name: item.category, groups: [] }));
      let group = category.groups.find((g) => g.name === item.subcategory);
      if (!group) category.groups.push((group = { name: item.subcategory, items: [] }));
      group.items.push(item);
    }
    return { categories };
  }

  async quote(
    items: { id: number; qty: number }[],
    serviceLevel: ServiceLevelName = 'STANDARD',
    firstOrder = false,
  ): Promise<Quote> {
    const merged = new Map<number, number>();
    for (const { id, qty } of items) merged.set(id, Math.min(99, (merged.get(id) ?? 0) + qty));
    const found = await this.prisma.priceItem.findMany({ where: { id: { in: [...merged.keys()] }, active: true } });
    if (found.length !== merged.size) throw new BadRequestException('One of the selected items is no longer available.');
    const s = await this.settings.all();
    return computeQuote({
      lines: found.map((p) => ({ id: p.id, name: p.name, unit: p.unit, qty: merged.get(p.id)!, unitLbp: p.priceLbp })),
      serviceLevel,
      firstOrder,
      rate: s.usd_lbp_rate,
      deliveryUsd: s.pickup_delivery_fee_usd,
      expressMultiplier: s.express_multiplier,
      firstOrderDiscountPercent: s.first_order_discount_percent,
    });
  }

  // ----- admin -----

  listAll() {
    return this.prisma.priceItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  }

  async create(dto: UpsertPriceItemDto) {
    const last = await this.prisma.priceItem.aggregate({ _max: { sortOrder: true } });
    return this.prisma.priceItem.create({
      data: { ...this.data(dto), sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
  }

  async update(id: number, dto: UpsertPriceItemDto) {
    const exists = await this.prisma.priceItem.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Price item not found.');
    return this.prisma.priceItem.update({ where: { id }, data: this.data(dto) });
  }

  private data(dto: UpsertPriceItemDto) {
    return {
      category: dto.category.trim(),
      subcategory: dto.subcategory?.trim() || null,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      priceLbp: dto.priceLbp,
      unit: dto.unit.trim(),
      active: dto.active ?? true,
    };
  }
}
