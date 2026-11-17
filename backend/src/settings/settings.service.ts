import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhone } from '../common/phone.util';
import { BOOKING_DAYS, beirutNow } from '../common/time.util';
import { UpdateSettingsDto } from './settings.dto';

export const DEFAULT_SETTINGS = {
  areas: [
    'Achrafieh', 'Badaro', 'Hamra', 'Ras Beirut', 'Verdun', 'Mar Mikhael', 'Sin El Fil', 'Dekwaneh',
    'Jdeideh', 'Antelias', 'Dbayeh', 'Jal El Dib', 'Zalka', 'Baabda', 'Hazmieh', 'Hadath',
    'Jounieh', 'Kaslik', 'Zouk', 'Jbeil', 'Broummana', 'Beit Mery', 'Aley', 'Saida', 'Tripoli', 'Zahle',
  ],
  slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'],
  slot_capacity: 3,
  business_whatsapp: '',
  business_email: '',
  site_url: '',
  // Pricing. The price list is in LBP; USD is an estimate at this rate. Update it in Admin when the rate moves.
  usd_lbp_rate: 89500,
  pickup_delivery_fee_usd: 5,
  express_multiplier: 2,
  first_order_discount_percent: 15,
  // Gift cards
  gift_card_presets: [25, 50, 100, 200],
  gift_card_min_usd: 10,
  gift_card_max_usd: 1000,
  gift_card_valid_months: 12,
};

export type Settings = typeof DEFAULT_SETTINGS;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async all(): Promise<Settings> {
    const rows = await this.prisma.setting.findMany();
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    const out: Record<string, unknown> = {};
    for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) out[key] = stored.has(key) ? stored.get(key) : fallback;
    return out as Settings;
  }

  async save(dto: UpdateSettingsDto): Promise<Settings> {
    const next: Record<string, unknown> = { ...dto };
    if (dto.business_whatsapp !== undefined) {
      next.business_whatsapp = dto.business_whatsapp ? normalizePhone(dto.business_whatsapp, 'Business WhatsApp') : '';
    }
    if (dto.site_url !== undefined) {
      const url = dto.site_url.trim();
      if (url && !/^https:\/\//.test(url)) throw new BadRequestException('Website address must start with https://');
      next.site_url = url.replace(/\/$/, '');
    }
    if (dto.slots?.some((s) => !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(s))) {
      throw new BadRequestException('Pickup times must look like 09:00-11:00.');
    }
    await this.prisma.$transaction(
      Object.entries(next)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) =>
          this.prisma.setting.upsert({
            where: { key },
            create: { key, value: value as Prisma.InputJsonValue },
            update: { value: value as Prisma.InputJsonValue },
          }),
        ),
    );
    return this.all();
  }

  async publicConfig() {
    const s = await this.all();
    return {
      areas: s.areas,
      slots: s.slots,
      business_whatsapp: s.business_whatsapp,
      business_email: s.business_email,
      today: beirutNow().date,
      booking_days: BOOKING_DAYS,
      usd_lbp_rate: s.usd_lbp_rate,
      pickup_delivery_fee_usd: s.pickup_delivery_fee_usd,
      express_multiplier: s.express_multiplier,
      first_order_discount_percent: s.first_order_discount_percent,
      gift_card_presets: s.gift_card_presets,
      gift_card_min_usd: s.gift_card_min_usd,
      gift_card_max_usd: s.gift_card_max_usd,
    };
  }
}
