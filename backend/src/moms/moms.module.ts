import { Module } from '@nestjs/common';
import { MomsController } from './moms.controller';
import { MomsService } from './moms.service';

@Module({ controllers: [MomsController], providers: [MomsService], exports: [MomsService] })
export class MomsModule {}
