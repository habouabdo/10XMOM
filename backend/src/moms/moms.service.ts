import { Injectable, NotFoundException } from '@nestjs/common';
import { Mom } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { normalizePhone } from '../common/phone.util';
import { UpsertMomDto } from './moms.dto';

export const momAreas = (mom: Pick<Mom, 'areas'>): string[] => (Array.isArray(mom.areas) ? (mom.areas as string[]) : []);

@Injectable()
export class MomsService {
  constructor(private readonly prisma: PrismaService, private readonly settings: SettingsService) {}

  async activeInArea(area: string) {
    const moms = await this.prisma.mom.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return moms.filter((m) => momAreas(m).includes(area));
  }

  async publicInArea(area: string) {
    return { moms: (await this.activeInArea(area)).map(({ id, name, bio }) => ({ id, name, bio })) };
  }

  async list() {
    const moms = await this.prisma.mom.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] });
    const open = await this.prisma.order.groupBy({
      by: ['momId'],
      where: { momId: { not: null }, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      _count: { _all: true },
    });
    const counts = new Map(open.map((o) => [o.momId, o._count._all]));
    return { moms: moms.map((m) => ({ ...m, areas: momAreas(m), open_orders: counts.get(m.id) ?? 0 })) };
  }

  async create(dto: UpsertMomDto) {
    await this.prisma.mom.create({ data: await this.data(dto) });
    return this.list();
  }

  async update(id: number, dto: UpsertMomDto) {
    if (!(await this.prisma.mom.findUnique({ where: { id } }))) throw new NotFoundException('Mom not found.');
    await this.prisma.mom.update({ where: { id }, data: await this.data(dto) });
    return this.list();
  }

  private async data(dto: UpsertMomDto) {
    const { areas: allowed } = await this.settings.all();
    return {
      name: dto.name.trim(),
      phone: dto.phone?.trim() ? normalizePhone(dto.phone) : '',
      areas: [...new Set(dto.areas.filter((a) => allowed.includes(a)))],
      bio: dto.bio?.trim() ?? '',
      active: dto.active ?? true,
    };
  }
}
