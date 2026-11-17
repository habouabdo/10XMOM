import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthUser, JwtAuthGuard, SESSION_COOKIE } from '../common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './auth.dto';

const SESSION_HOURS = 12;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private cookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.COOKIE_SECURE === '1',
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, this.cookieOptions(SESSION_HOURS * 3600 * 1000));
    return { ok: true, user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions(0));
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: AuthUser }) {
    return { ok: true, user: { email: req.user.email, role: req.user.role } };
  }

  @Post('password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  password(@Req() req: Request & { user: AuthUser }, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub, dto.current, dto.next);
  }
}
