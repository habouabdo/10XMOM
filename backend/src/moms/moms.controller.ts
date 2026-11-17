import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { SettingsService } from '../settings/settings.service';
import { UpsertMomDto } from './moms.dto';
import { MomsService } from './moms.service';

@ApiTags('moms')
@Controller()
export class MomsController {
  constructor(private readonly moms: MomsService, private readonly settings: SettingsService) {}

  @Get('moms')
  async inArea(@Query('area') area: string) {
    if (!area || !(await this.settings.all()).areas.includes(area)) throw new BadRequestException('Please choose an area from the list.');
    return this.moms.publicInArea(area);
  }

  @Get('admin/moms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  list() {
    return this.moms.list();
  }

  @Post('admin/moms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: UpsertMomDto) {
    return this.moms.create(dto);
  }

  @Patch('admin/moms/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertMomDto) {
    return this.moms.update(id, dto);
  }
}
