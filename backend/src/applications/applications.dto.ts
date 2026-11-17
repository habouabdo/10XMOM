import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80)
  name: string;

  @ApiProperty() @IsString() @MaxLength(30)
  phone: string;

  @ApiProperty() @IsString() @MaxLength(80)
  area: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  experience?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  hasCar?: boolean;
}

export class UpdateApplicationDto {
  @ApiProperty({ enum: ApplicationStatus }) @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
