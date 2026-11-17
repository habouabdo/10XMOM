import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GiftCardStatus, Order, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { GiftCardsService } from '../gift-cards/gift-cards.service';
import { MomsService, momAreas } from '../moms/moms.service';
import { SettingsService } from '../settings/settings.service';
import { randomCode } from '../common/code.util';
import { normalizePhone } from '../common/phone.util';
import { round2, toNumber } from '../common/money';
import { isSlotOpen } from '../common/time.util';
import { AvailabilityQuery, CreateOrderDto, ListOrdersQuery, STATUS_KEYS, StatusKey, TrackQuery, UpdateOrderDto } from './orders.dto';

export const STATUS_LABELS: Record<StatusKey, string> = {
  booked: 'Booked',
  picked_up: 'Picked up',
  priced: 'Priced – awaiting payment',
  paid: 'Paid',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const toKey = (s: OrderStatus) => s.toLowerCase() as StatusKey;
const toStatus = (k: StatusKey) => k.toUpperCase() as OrderStatus;

type OrderWithRelations = Order & { mom: { name: string } | null; events: { status: OrderStatus; note: string; createdAt: Date }[] };

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly catalog: CatalogService,
    private readonly moms: MomsService,
    private readonly giftCards: GiftCardsService,
  ) {}

  // ---------- public ----------

  async availability(query: AvailabilityQuery) {
    const s = await this.settings.all();
    if (!s.areas.includes(query.area)) throw new BadRequestException('Please choose an area from the list.');
    const momId = query.momId && query.momId !== 'any' ? Number(query.momId) : null;
    if (momId !== null && (!Number.isInteger(momId) || momId <= 0)) throw new BadRequestException('Mom is invalid.');
    const moms = (await this.moms.activeInArea(query.area)).filter((m) => !momId || m.id === momId);
    const slots = [];
    for (const slot of s.slots) {
      let available = false;
      if (isSlotOpen(query.date, slot)) {
        for (const mom of moms) {
          if ((await this.slotLoad(this.prisma, mom.id, query.date, slot)) < s.slot_capacity) { available = true; break; }
        }
      }
      slots.push({ slot, available });
    }
    return { date: query.date, slots };
  }

  async create(dto: CreateOrderDto) {
    const s = await this.settings.all();
    const phone = normalizePhone(dto.phone, 'WhatsApp number');
    const notes = dto.notes?.trim() ?? '';
    if (!s.areas.includes(dto.area)) throw new BadRequestException('Please choose an area from the list.');
    if (!s.slots.includes(dto.pickupSlot)) throw new BadRequestException('Please choose a pickup day and time.');
    if (!isSlotOpen(dto.pickupDate, dto.pickupSlot)) throw new ConflictException('That pickup time is no longer available. Please pick another.');
    if (!dto.items.length && !notes) throw new BadRequestException('Tell us what we are picking up: add at least one item or a note.');

    const serviceLevel = dto.serviceLevel ?? 'STANDARD';
    const firstOrder = (await this.prisma.order.count({ where: { phone, status: { not: 'CANCELLED' } } })) === 0;
    const quote = dto.items.length ? await this.catalog.quote(dto.items, serviceLevel, firstOrder) : null;
    const giftCard = dto.giftCardCode?.trim() ? await this.giftCards.findUsable(dto.giftCardCode) : null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const candidates = (await this.moms.activeInArea(dto.area)).filter((m) => !dto.momId || m.id === dto.momId);
            const free: { id: number; name: string; load: number }[] = [];
            for (const mom of candidates) {
              const load = await this.slotLoad(tx, mom.id, dto.pickupDate, dto.pickupSlot);
              if (load < s.slot_capacity) free.push({ id: mom.id, name: mom.name, load });
            }
            const mom = free.sort((a, b) => a.load - b.load)[0];
            if (!mom) {
              throw new ConflictException(
                dto.momId ? 'That Mom is not free at that time. Please pick another time or another Mom.' : 'Sorry, no Mom is free at that time. Please pick another time.',
              );
            }
            const order = await tx.order.create({
              data: {
                code: randomCode('10X-'),
                customerName: dto.name.trim(),
                phone,
                area: dto.area,
                address: dto.address.trim(),
                addressNotes: dto.addressNotes?.trim() ?? '',
                items: quote ? quote.lines.map(({ id, name, qty, unitLbp }) => ({ id, name, qty, unitLbp })) : [],
                notes,
                serviceLevel,
                estimateUsd: quote?.totalUsd ?? null,
                momId: mom.id,
                pickupDate: dto.pickupDate,
                pickupSlot: dto.pickupSlot,
                giftCardId: giftCard?.id ?? null,
                events: { create: { status: 'BOOKED', note: 'Order placed online' } },
              },
            });
            return { code: order.code, momName: mom.name, pickupDate: order.pickupDate, pickupSlot: order.pickupSlot, quote };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === 'P2002' || err.code === 'P2034')) continue; // code clash / write conflict: retry
        throw err;
      }
    }
    throw new ConflictException('We are busy right now. Please try again in a moment.');
  }

  async track(query: TrackQuery) {
    const phone = normalizePhone(query.phone, 'WhatsApp number');
    const order = await this.prisma.order.findUnique({
      where: { code: query.code.trim().toUpperCase() },
      include: { mom: { select: { name: true } }, events: { orderBy: { id: 'asc' } } },
    });
    if (!order || order.phone !== phone) throw new NotFoundException("We couldn't find an order with that code and number.");
    const price = toNumber(order.priceUsd);
    const gift = toNumber(order.giftAppliedUsd) ?? 0;
    return {
      code: order.code,
      status: toKey(order.status),
      statusLabel: STATUS_LABELS[toKey(order.status)],
      firstName: order.customerName.split(/\s+/)[0],
      area: order.area,
      pickupDate: order.pickupDate,
      pickupSlot: order.pickupSlot,
      momName: order.mom?.name ?? null,
      serviceLevel: order.serviceLevel,
      items: order.items,
      estimateUsd: toNumber(order.estimateUsd),
      priceUsd: price,
      giftAppliedUsd: gift,
      amountDueUsd: price == null ? null : round2(price - gift),
      paymentLink: order.status === 'PRICED' ? order.paymentLink : '',
      events: order.events.map((e) => ({ status: toKey(e.status), createdAt: e.createdAt })),
    };
  }

  // ---------- admin ----------

  async list(query: ListOrdersQuery) {
    const status = query.status || 'active';
    const search = query.q?.trim() ?? '';
    const where: Prisma.OrderWhereInput = {};
    if (status === 'active') where.status = { notIn: ['DELIVERED', 'CANCELLED'] };
    else if (status !== 'all') {
      if (!(STATUS_KEYS as readonly string[]).includes(status)) throw new BadRequestException('Unknown status filter.');
      where.status = toStatus(status as StatusKey);
    }
    if (search) {
      const digits = search.replace(/\D/g, '');
      where.OR = [
        { code: { contains: search } },
        { customerName: { contains: search } },
        ...(digits ? [{ phone: { contains: digits } }] : []),
      ];
    }
    const rows = await this.prisma.order.findMany({
      where,
      include: { mom: { select: { name: true } }, events: { orderBy: { id: 'asc' } } },
      orderBy: [{ pickupDate: 'asc' }, { pickupSlot: 'asc' }, { id: 'asc' }],
      take: 500,
    });
    const grouped = await this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    return {
      orders: rows.map((r) => this.serialize(r)),
      counts: Object.fromEntries(grouped.map((g) => [toKey(g.status), g._count._all])),
      statuses: STATUS_LABELS,
    };
  }

  async update(id: number, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { giftCard: true } });
    if (!order) throw new NotFoundException('Order not found.');
    const data: Prisma.OrderUncheckedUpdateInput = {};

    if ('momId' in dto) {
      if (dto.momId == null) data.momId = null;
      else {
        if (!(await this.prisma.mom.findUnique({ where: { id: dto.momId } }))) throw new BadRequestException('That Mom does not exist.');
        data.momId = dto.momId;
      }
    }
    if ('priceUsd' in dto) data.priceUsd = dto.priceUsd == null ? null : round2(dto.priceUsd);
    if (dto.paymentLink !== undefined) {
      const link = dto.paymentLink.trim();
      if (link && !/^https:\/\//.test(link)) throw new BadRequestException('Whish payment link must start with https://');
      data.paymentLink = link;
    }

    const price = 'priceUsd' in dto ? (dto.priceUsd == null ? null : round2(dto.priceUsd)) : toNumber(order.priceUsd);
    const link = dto.paymentLink !== undefined ? dto.paymentLink.trim() : order.paymentLink;
    let status: OrderStatus = dto.status ? toStatus(dto.status) : order.status;

    // Gift card: applied (and the balance reduced) when the order is priced. Re-pricing re-applies from the full balance.
    const card = order.giftCard;
    const currentApplied = toNumber(order.giftAppliedUsd) ?? 0;
    const eligible = !!card && price != null && ['BOOKED', 'PICKED_UP', 'PRICED'].includes(order.status) && status !== 'CANCELLED';
    const availableBalance = card ? round2(Number(card.balanceUsd) + currentApplied) : 0;
    const potentialApplied = eligible ? round2(Math.min(availableBalance, price!)) : currentApplied;
    const due = price == null ? null : round2(price - potentialApplied);

    // Entering a price (and a Whish link, unless a gift card covers it) on a collected order moves it to "priced".
    if (status === order.status && price != null && (link || due! <= 0) && ['BOOKED', 'PICKED_UP'].includes(order.status)) status = 'PRICED';
    if (status === 'PRICED') {
      if (price == null) throw new BadRequestException('Add the price before marking the order as priced.');
      if (due! > 0 && !link) throw new BadRequestException('Add the Whish payment link before marking the order as priced.');
      if (due! <= 0) status = 'PAID';
    }
    if (status === 'PAID' && order.status !== 'PAID') data.paidAt = new Date();

    const applied =
      status === 'CANCELLED' ? 0 : eligible && (status === 'PRICED' || status === 'PAID') ? potentialApplied : currentApplied;
    data.status = status;
    data.giftAppliedUsd = applied;
    const note = dto.note?.trim() || (status === 'PAID' && order.status !== 'PAID' && due != null && due <= 0 && eligible ? 'Fully covered by gift card' : '');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (card && applied !== currentApplied) {
        const balance = round2(availableBalance - applied);
        await tx.giftCardRedemption.deleteMany({ where: { orderId: id } });
        if (applied > 0) await tx.giftCardRedemption.create({ data: { orderId: id, giftCardId: card.id, amountUsd: applied } });
        await tx.giftCard.update({
          where: { id: card.id },
          data: {
            balanceUsd: balance,
            ...(card.status === 'ACTIVE' || card.status === 'REDEEMED' ? { status: balance <= 0 ? GiftCardStatus.REDEEMED : GiftCardStatus.ACTIVE } : {}),
          },
        });
      }
      await tx.order.update({ where: { id }, data });
      if (status !== order.status || note) await tx.orderEvent.create({ data: { orderId: id, status, note } });
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: { mom: { select: { name: true } }, events: { orderBy: { id: 'asc' } } },
      });
    });
    return { order: this.serialize(updated) };
  }

  // ---------- helpers ----------

  private slotLoad(db: Prisma.TransactionClient | PrismaService, momId: number, date: string, slot: string) {
    return db.order.count({ where: { momId, pickupDate: date, pickupSlot: slot, status: { not: 'CANCELLED' } } });
  }

  private serialize(o: OrderWithRelations) {
    return {
      id: o.id,
      code: o.code,
      customerName: o.customerName,
      phone: o.phone,
      area: o.area,
      address: o.address,
      addressNotes: o.addressNotes,
      items: o.items,
      notes: o.notes,
      serviceLevel: o.serviceLevel,
      estimateUsd: toNumber(o.estimateUsd),
      momId: o.momId,
      momName: o.mom?.name ?? null,
      pickupDate: o.pickupDate,
      pickupSlot: o.pickupSlot,
      status: toKey(o.status),
      priceUsd: toNumber(o.priceUsd),
      giftCardId: o.giftCardId,
      giftAppliedUsd: toNumber(o.giftAppliedUsd) ?? 0,
      paymentLink: o.paymentLink,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
      events: o.events.map((e) => ({ status: toKey(e.status), note: e.note, createdAt: e.createdAt })),
    };
  }
}

export { momAreas };
