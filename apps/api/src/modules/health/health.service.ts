import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      return { status: 'ok', db: 'ok', version: process.env.RELEASE_VERSION ?? 'dev' };
    } catch {
      return { status: 'ok', db: 'degraded', version: process.env.RELEASE_VERSION ?? 'dev' };
    }
  }
}
