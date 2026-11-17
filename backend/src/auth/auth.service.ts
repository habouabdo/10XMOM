import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../common/password.util';
import type { AuthUser } from '../common/jwt-auth.guard';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string): Promise<{ token: string; user: { email: string; role: string } }> {
    const user = await this.prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    // Same message for unknown email and wrong password.
    if (!user || !verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Wrong email or password.');
    const payload: AuthUser = { sub: user.id, email: user.email, role: user.role };
    return { token: await this.jwt.signAsync(payload), user: { email: user.email, role: user.role } };
  }

  async changePassword(userId: number, current: string, next: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user || !verifyPassword(current, user.passwordHash)) throw new BadRequestException('Current password is wrong.');
    await this.prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: hashPassword(next) } });
    return { ok: true };
  }
}
