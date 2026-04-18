import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ClassifiedStatus } from '@palmital/types';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClassifiedDto, UpdateClassifiedStatusDto } from './dto/update-classified.dto';
import { ClassifiedsQueryDto } from './dto/classifieds-query.dto';

@Injectable()
export class ClassifiedsService {
  constructor(private prisma: PrismaService) {}

  async list(query: ClassifiedsQueryDto) {
    const limit = query.limit ?? 20;
    const where: any = { status: query.status ?? ClassifiedStatus.ACTIVE };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };

    if (query.cursor) {
      const cursor = await this.prisma.classified.findUnique({ where: { id: query.cursor } });
      if (cursor) where.createdAt = { lt: cursor.createdAt };
    }

    const items = await this.prisma.classified.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        category: true,
        post: { include: { media: true } },
      },
    });

    return { items, nextCursor: items.length === limit ? items[items.length - 1].id : null };
  }

  async getById(id: string) {
    const item = await this.prisma.classified.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        category: true,
        post: { include: { media: true } },
      },
    });
    if (!item) throw new NotFoundException('Classified not found');
    return item;
  }

  async update(id: string, userId: string, dto: UpdateClassifiedDto) {
    const item = await this.prisma.classified.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    if (item.authorId !== userId) throw new ForbiddenException();
    return this.prisma.classified.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, userId: string, dto: UpdateClassifiedStatusDto) {
    const item = await this.prisma.classified.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    if (item.authorId !== userId) throw new ForbiddenException();
    return this.prisma.classified.update({ where: { id }, data: { status: dto.status } });
  }

  async remove(id: string, userId: string, role: string) {
    const item = await this.prisma.classified.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    if (item.authorId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.classified.delete({ where: { id } });
  }
}
