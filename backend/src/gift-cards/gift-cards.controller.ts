import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { GiftCardsService } from './gift-cards.service';
import { PurchaseGiftCardDto, UpdateGiftCardDto } from './gift-cards.dto';

class CheckQuery {
  @IsString() @MaxLength(20)
  code: string;
}

@ApiTags('gift-cards')
@Controller()
export class GiftCardsController {
  constructor(private readonly giftCards: GiftCardsService) {}

  @Post('gift-cards')
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  purchase(@Body() dto: PurchaseGiftCardDto) {
    return this.giftCards.purchase(dto);
  }

  @Get('gift-cards/check')
  @Throttle({ default: { limit: 20, ttl: 10 * 60 * 1000 } })
  check(@Query() query: CheckQuery) {
    return this.giftCards.check(query.code);
  }

  @Get('admin/gift-cards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  list() {
    return this.giftCards.list();
  }

  @Patch('admin/gift-cards/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGiftCardDto) {
    return this.giftCards.update(id, dto);
  }
}
