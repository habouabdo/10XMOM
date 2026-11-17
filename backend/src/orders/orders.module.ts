import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { GiftCardsModule } from '../gift-cards/gift-cards.module';
import { MomsModule } from '../moms/moms.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [CatalogModule, GiftCardsModule, MomsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
