import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export enum ServiceLevelDto { STANDARD = 'STANDARD', EXPRESS = 'EXPRESS' }

export class QuoteItemDto {
  @ApiProperty() @IsInt() @Min(1)
  id: number;

  @ApiProperty() @IsInt() @Min(1) @Max(99)
  qty: number;
}

export class QuoteRequestDto {
  @ApiProperty({ type: [QuoteItemDto] }) @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @ApiPropertyOptional({ enum: ServiceLevelDto }) @IsOptional() @IsEnum(ServiceLevelDto)
  serviceLevel?: ServiceLevelDto;

  @ApiPropertyOptional({ description: 'Show the first-order discount in the estimate.' }) @IsOptional() @IsBoolean()
  firstOrder?: boolean;
}

export class UpsertPriceItemDto {
  @ApiProperty() @IsString() @MaxLength(60)
  category: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  subcategory?: string;

  @ApiProperty() @IsString() @MaxLength(100)
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)
  description?: string;

  @ApiProperty({ description: 'Lebanese pounds' }) @IsInt() @Min(0) @Max(1_000_000_000)
  priceLbp: number;

  @ApiProperty() @IsString() @MaxLength(60)
  unit: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}
