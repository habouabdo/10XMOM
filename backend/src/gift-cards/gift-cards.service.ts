import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GiftCard, GiftCardStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { randomCode } from '../common/code.util';
import { normalizePhone } from '../common/phone.util';
import { round2, toNumber } from '../common/money';
import { PurchaseGiftCardDto, UpdateGiftCardDto } from './gift-cards.dto';

type Tx = Prisma.TransactionClient;

export const serializeGiftCard = (g: GiftCard) => ({
  ...g,
  amountUsd: toNumber(g.amountUsd),
  balanceUsd: toNumber(g.balanceUsd),
});

@Injectable()
export class GiftCardsService {
  constructor(private readonly prisma: PrismaService, private readonly settings: SettingsService) {}

  async purchase(dto: PurchaseGiftCardDto) {
    const s = await this.settings.all();
    const amount = round2(dto.amountUsd);
    if (amount < s.gift_card_min_usd || amount > s.gift_card_max_usd) {
      throw new BadRequestException(`Gift card amount must be between $${s.gift_card_min_usd} and $${s.gift_card_max_usd}.`);
    }
    const data = {
      amountUsd: amount,
      balanceUsd: amount,
      buyerName: dto.buyerName.trim(),
      buyerPhone: normalizePhone(dto.buyerPhone, 'Your WhatsApp number'),
      recipientName: dto.recipientName.trim(),
      recipientPhone: dto.recipientPhone?.trim() ? normalizePhone(dto.recipientPhone, 'Recipient WhatsApp number') : '',
      message: dto.message?.trim() ?? '',
    };
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const card = await this.prisma.giftCard.create({ data: { ...data, code: randomCode('GC-') } });
        return { code: card.code, amountUsd: amount };
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      }
    }
    throw new Error('Could not generate a unique gift card code.');
  }

  /** Public balance check. Returns the same message for unknown, unpaid and expired codes. */
  async check(code: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!card || !this.isUsable(card)) throw new NotFoundException('That gift card code is not valid or not active yet.');
    return { code: card.code, balanceUsd: toNumber(card.balanceUsd), expiresAt: card.expiresAt, recipientName: card.recipientName };
  }

  /** Used by orders when a customer enters a gift card code at booking. */
  async findUsable(code: string, tx: Tx | PrismaService = this.prisma): Promise<GiftCard> {
    const card = await tx.giftCard.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!card || !this.isUsable(card)) throw new BadRequestException('That gift card code is not valid or not active yet.');
    return card;
  }

  private isUsable(card: GiftCard) {
    return (
      card.status === GiftCardStatus.ACTIVE &&
      Number(card.balanceUsd) > 0 &&
      (!card.expiresAt || card.expiresAt.getTime() > Date.now())
    );
  }

  // ----- admin -----

  async list() {
    const cards = await this.prisma.giftCard.findMany({ orderBy: { id: 'desc' }, take: 500 });
    return { giftCards: cards.map(serializeGiftCard) };
  }

  async update(id: number, dto: UpdateGiftCardDto) {
    const card = await this.prisma.giftCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Gift card not found.');
    const data: Prisma.GiftCardUpdateInput = {};

    if (dto.paymentLink !== undefined) {
      const link = dto.paymentLink.trim();
      if (link && !/^https:\/\//.test(link)) throw new BadRequestException('Whish payment link must start with https://');
      data.paymentLink = link;
    }
    if (dto.status && dto.status !== card.status) {
      const allowed: Record<GiftCardStatus, GiftCardStatus[]> = {
        PENDING_PAYMENT: ['ACTIVE', 'CANCELLED'],
        ACTIVE: ['CANCELLED'],
        REDEEMED: [],
        CANCELLED: [],
      };
      if (!allowed[card.status].includes(dto.status)) {
        throw new BadRequestException(`A ${card.status.toLowerCase().replace('_', ' ')} card cannot become ${dto.status.toLowerCase()}.`);
      }
      data.status = dto.status;
      if (dto.status === 'ACTIVE') {
        const s = await this.settings.all();
        const expires = new Date();
        expires.setMonth(expires.getMonth() + s.gift_card_valid_months);
        data.paidAt = new Date();
        data.expiresAt = expires;
      }
    }
    return serializeGiftCard(await this.prisma.giftCard.update({ where: { id }, data }));
  }
}
