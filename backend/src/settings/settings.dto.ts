import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEmail, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(80, { each: true })
  areas?: string[];

  @ApiPropertyOptional({ type: [String], example: ['09:00-11:00'] }) @IsOptional() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(24) @IsString({ each: true })
  slots?: string[];

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(50)
  slot_capacity?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  business_whatsapp?: string;

  @ApiPropertyOptional() @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail({}, { message: 'Email address is invalid.' }) @MaxLength(120)
  business_email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200)
  site_url?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1000) @Max(10_000_000)
  usd_lbp_rate?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(1000)
  pickup_delivery_fee_usd?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(5)
  express_multiplier?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100)
  first_order_discount_percent?: number;

  @ApiPropertyOptional({ type: [Number] }) @IsOptional() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(8) @IsNumber({}, { each: true }) @Min(1, { each: true })
  gift_card_presets?: number[];

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)
  gift_card_min_usd?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)
  gift_card_max_usd?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(60)
  gift_card_valid_months?: number;
}
