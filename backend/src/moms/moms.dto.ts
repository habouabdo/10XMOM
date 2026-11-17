import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertMomDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(60)
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true })
  areas: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)
  bio?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}
