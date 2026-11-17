import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AvailabilityQuery, CreateOrderDto, ListOrdersQuery, TrackQuery, UpdateOrderDto } from './orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('availability')
  availability(@Query() query: AvailabilityQuery) {
    return this.orders.availability(query);
  }

  @Post('orders')
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('track')
  @Throttle({ default: { limit: 40, ttl: 10 * 60 * 1000 } })
  track(@Query() query: TrackQuery) {
    return this.orders.track(query);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  list(@Query() query: ListOrdersQuery) {
    return this.orders.list(query);
  }

  @Patch('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.orders.update(id, dto);
  }
}
