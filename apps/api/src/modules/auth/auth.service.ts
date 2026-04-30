import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isValidUsername, normalizeUsername } from '@palmital/utils';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const username = await this.generateUniqueUsername(dto.username || dto.displayName);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        profile: {
          create: {
            displayName: dto.displayName,
            username,
          },
        },
      },
      include: { profile: true },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { profile: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user);
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              username: user.profile.username,
              avatarUrl: user.profile.avatarUrl,
              coverUrl: user.profile.coverUrl,
            }
          : null,
      },
    };
  }

  async validateWsToken(token: string) {
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      return await this.prisma.user.findUnique({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }

  private async generateUniqueUsername(input: string) {
    const normalized = normalizeUsername(input).slice(0, 24);
    const base = normalized.length >= 3 ? normalized : 'usuario';

    if (!isValidUsername(base)) {
      throw new BadRequestException('Invalid username');
    }

    const existing = await this.prisma.profile.findUnique({ where: { username: base } });
    if (!existing) {
      return base;
    }

    for (let i = 1; i <= 100; i += 1) {
      const candidate = `${base.slice(0, Math.max(1, 24 - String(i).length - 1))}_${i}`;
      const candidateExists = await this.prisma.profile.findUnique({ where: { username: candidate } });
      if (!candidateExists) {
        return candidate;
      }
    }

    throw new ConflictException('Username already in use');
  }
}
