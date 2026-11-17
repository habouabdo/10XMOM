import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CatalogService } from './catalog.service';
import { QuoteRequestDto, UpsertPriceItemDto } from './catalog.dto';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('catalog')
  grouped() {
    return this.catalog.grouped();
  }

  @Post('quotes')
  @HttpCode(200)
  quote(@Body() dto: QuoteRequestDto) {
    return this.catalog.quote(dto.items, dto.serviceLevel ?? 'STANDARD', dto.firstOrder ?? false);
  }

  @Get('admin/prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  listAll() {
    return this.catalog.listAll();
  }

  @Post('admin/prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: UpsertPriceItemDto) {
    return this.catalog.create(dto);
  }

  @Put('admin/prices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertPriceItemDto) {
    return this.catalog.update(id, dto);
  }
}
