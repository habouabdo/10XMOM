import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty() @IsEmail() @MaxLength(160)
  email: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MaxLength(200)
  current: string;

  @ApiProperty({ minLength: 12 }) @IsString() @MinLength(12, { message: 'New password must be at least 12 characters.' }) @MaxLength(200)
  next: string;
}
