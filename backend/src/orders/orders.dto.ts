import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { QuoteItemDto, ServiceLevelDto } from '../catalog/catalog.dto';

export const STATUS_KEYS = ['booked', 'picked_up', 'priced', 'paid', 'out_for_delivery', 'delivered', 'cancelled'] as const;
export type StatusKey = (typeof STATUS_KEYS)[number];

export class CreateOrderDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80)
  name: string;

  @ApiProperty({ example: '03 123 456' }) @IsString() @MaxLength(30)
  phone: string;

  @ApiProperty() @IsString() @MaxLength(80)
  area: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(300)
  address: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  addressNotes?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [QuoteItemDto], description: 'Items from /catalog. May be empty if notes explain the load.' })
  @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @ApiPropertyOptional({ enum: ServiceLevelDto }) @IsOptional() @IsEnum(ServiceLevelDto)
  serviceLevel?: ServiceLevelDto;

  @ApiPropertyOptional({ description: 'Omit for "any available Mom".' }) @IsOptional() @IsInt() @Min(1)
  momId?: number;

  @ApiProperty({ example: '2026-11-20' }) @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please choose a pickup day and time.' })
  pickupDate: string;

  @ApiProperty({ example: '09:00-11:00' }) @IsString() @MaxLength(11)
  pickupSlot: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  giftCardCode?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: STATUS_KEYS }) @IsOptional() @IsIn(STATUS_KEYS as unknown as string[], { message: 'Unknown status.' })
  status?: StatusKey;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(1)
  momId?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Final price in USD' }) @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000)
  priceUsd?: number | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  paymentLink?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)
  note?: string;
}

export class AvailabilityQuery {
  @IsString() @MaxLength(80)
  area: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date is invalid.' })
  date: string;

  @IsOptional() @IsString() @MaxLength(8)
  momId?: string;
}

export class TrackQuery {
  @IsString() @MaxLength(20)
  code: string;

  @IsString() @MaxLength(30)
  phone: string;
}

export class ListOrdersQuery {
  @IsOptional() @IsString() @MaxLength(20)
  status?: string;

  @IsOptional() @IsString() @MaxLength(80)
  q?: string;
}
