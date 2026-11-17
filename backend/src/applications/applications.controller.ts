import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { normalizePhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateApplicationDto, UpdateApplicationDto } from './applications.dto';

@ApiTags('applications')
@Controller()
export class ApplicationsController {
  constructor(private readonly prisma: PrismaService, private readonly settings: SettingsService) {}

  @Post('applications')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  async create(@Body() dto: CreateApplicationDto) {
    if (!(await this.settings.all()).areas.includes(dto.area)) throw new BadRequestException('Please choose an area from the list.');
    await this.prisma.application.create({
      data: {
        name: dto.name.trim(),
        phone: normalizePhone(dto.phone, 'WhatsApp number'),
        area: dto.area,
        experience: dto.experience?.trim() ?? '',
        hasCar: dto.hasCar ?? false,
      },
    });
    return { ok: true };
  }

  @Get('admin/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async list() {
    return { applications: await this.prisma.application.findMany({ orderBy: { id: 'desc' }, take: 500 }) };
  }

  @Patch('admin/applications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto) {
    if (!(await this.prisma.application.findUnique({ where: { id } }))) throw new NotFoundException('Application not found.');
    await this.prisma.application.update({ where: { id }, data: { status: dto.status } });
    return { ok: true };
  }
}
