import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, company: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        profile: true,
        company: { select: { id: true, name: true, slug: true, logoUrl: true } },
        _count: {
          select: {
            posts: true,
            classifieds: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async searchUsers(currentUserId: string, query: SearchUsersQueryDto) {
    const term = query.q?.trim();
    if (!term) return [];

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { profile: { is: { displayName: { contains: term, mode: 'insensitive' } } } },
        ],
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            city: true,
          },
        },
      },
      take: query.limit ?? 12,
    });

    return users.sort((a, b) => {
      const aName = (a.profile?.displayName || a.email).toLocaleLowerCase();
      const bName = (b.profile?.displayName || b.email).toLocaleLowerCase();
      return aName.localeCompare(bName, 'pt-BR');
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { phone, ...profileData } = dto;

    if (phone) {
      await this.prisma.user.update({ where: { id: userId }, data: { phone } });
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, displayName: profileData.displayName || 'Usuário', ...profileData },
      update: profileData,
    });

    return profile;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: 'Usuário',
        avatarUrl,
      },
      update: { avatarUrl },
    });
  }
}
