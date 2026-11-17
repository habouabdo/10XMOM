import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GiftCardStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class PurchaseGiftCardDto {
  @ApiProperty({ example: 50 }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1)
  amountUsd: number;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80)
  buyerName: string;

  @ApiProperty() @IsString() @MaxLength(30)
  buyerPhone: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80)
  recipientName: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  recipientPhone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)
  message?: string;
}

export class UpdateGiftCardDto {
  @ApiPropertyOptional({ enum: GiftCardStatus }) @IsOptional() @IsEnum(GiftCardStatus)
  status?: GiftCardStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  paymentLink?: string;
}
