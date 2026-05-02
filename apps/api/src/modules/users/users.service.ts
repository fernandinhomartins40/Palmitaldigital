import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidUsername, normalizeUsername } from '@palmital/utils';
import { UploadStorageService } from '../../common/storage/upload-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadStorage: UploadStorageService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        company: true,
        _count: {
          select: {
            followers: true,
            following: true,
            stories: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getPublicProfile(userId: string, viewerId?: string) {
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
            followers: true,
            following: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.withFollowStatus(user, viewerId);
  }

  async getPublicProfileByUsername(username: string, viewerId?: string) {
    const normalized = this.normalizeOrThrow(username);
    const user = await this.prisma.user.findFirst({
      where: { profile: { is: { username: normalized } } },
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
            followers: true,
            following: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.withFollowStatus(user, viewerId);
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('cannot follow yourself');
    }

    await this.prisma.user.findUniqueOrThrow({ where: { id: followingId } });

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });

    return this.getPublicProfile(followingId, followerId);
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
    return this.getPublicProfile(followingId, followerId);
  }

  async getFollowers(userId: string) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      include: { follower: { include: { profile: true } } },
    });
  }

  async getFollowing(userId: string) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { following: { include: { profile: true } } },
    });
  }

  async checkUsernameAvailability(username: string, currentUserId?: string) {
    const normalized = normalizeUsername(username);
    if (
      !normalized ||
      normalized.length < 3 ||
      normalized.length > 24 ||
      !isValidUsername(normalized)
    ) {
      return { username: normalized, available: false, valid: false };
    }

    const existing = await this.prisma.profile.findUnique({
      where: { username: normalized },
      select: { userId: true },
    });

    const available = !existing || existing.userId === currentUserId;
    return { username: normalized, available, valid: true };
  }

  async searchUsers(currentUserId: string, query: SearchUsersQueryDto) {
    const term = query.q?.trim();
    if (!term) return [];

    const usernameTerm = normalizeUsername(term.replace(/^@/, ''));
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          usernameTerm
            ? { profile: { is: { username: { contains: usernameTerm, mode: 'insensitive' } } } }
            : undefined,
          { profile: { is: { displayName: { contains: term, mode: 'insensitive' } } } },
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            username: true,
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
    const { phone, username, ...profileData } = dto;

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: phone || null },
    });

    const nextUsername =
      username !== undefined ? await this.ensureUsernameAvailable(username, userId) : undefined;

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: profileData.displayName || 'Usuario',
        username:
          nextUsername ?? (await this.generateUniqueUsername(profileData.displayName || 'usuario')),
        ...profileData,
      },
      update: {
        ...profileData,
        ...(nextUsername ? { username: nextUsername } : {}),
      },
    });

    return profile;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const currentProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { avatarUrl: true, displayName: true, username: true },
    });

    const storedAvatar = await this.uploadStorage.storeAvatar(file);

    try {
      const profile = await this.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: currentProfile?.displayName ?? 'Usuario',
          username:
            currentProfile?.username ??
            (await this.generateUniqueUsername(currentProfile?.displayName ?? 'usuario')),
          avatarUrl: storedAvatar.url,
        },
        update: { avatarUrl: storedAvatar.url },
      });

      if (currentProfile?.avatarUrl && currentProfile.avatarUrl !== storedAvatar.url) {
        await this.uploadStorage.removeByUrl(currentProfile.avatarUrl);
      }

      return profile;
    } catch (error) {
      await this.uploadStorage.removeByUrl(storedAvatar.url);
      throw error;
    }
  }

  async updateCover(userId: string, file: Express.Multer.File) {
    const currentProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { coverUrl: true, displayName: true, username: true },
    });

    const storedCover = await this.uploadStorage.storeProfileCover(file);

    try {
      const profile = await this.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: currentProfile?.displayName ?? 'Usuario',
          username:
            currentProfile?.username ??
            (await this.generateUniqueUsername(currentProfile?.displayName ?? 'usuario')),
          coverUrl: storedCover.url,
        },
        update: { coverUrl: storedCover.url },
      });

      if (currentProfile?.coverUrl && currentProfile.coverUrl !== storedCover.url) {
        await this.uploadStorage.removeByUrl(currentProfile.coverUrl);
      }

      return profile;
    } catch (error) {
      await this.uploadStorage.removeByUrl(storedCover.url);
      throw error;
    }
  }

  async removeCover(userId: string) {
    const currentProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { coverUrl: true },
    });

    if (!currentProfile) {
      throw new NotFoundException('Profile not found');
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: { coverUrl: null },
    });

    await this.uploadStorage.removeByUrl(currentProfile.coverUrl);
    return profile;
  }

  private normalizeOrThrow(username: string) {
    const normalized = normalizeUsername(username);
    if (
      !normalized ||
      normalized.length < 3 ||
      normalized.length > 24 ||
      !isValidUsername(normalized)
    ) {
      throw new NotFoundException('User not found');
    }
    return normalized;
  }

  private async ensureUsernameAvailable(username: string, userId: string) {
    const normalized = this.normalizeOrThrow(username);
    const existing = await this.prisma.profile.findUnique({
      where: { username: normalized },
      select: { userId: true },
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictException('Username already in use');
    }

    return normalized;
  }

  private async generateUniqueUsername(input: string) {
    const normalized = normalizeUsername(input).slice(0, 24);
    const base = normalized.length >= 3 ? normalized : 'usuario';

    const existing = await this.prisma.profile.findUnique({ where: { username: base } });
    if (!existing) {
      return base;
    }

    for (let i = 1; i <= 100; i += 1) {
      const candidate = `${base.slice(0, Math.max(1, 24 - String(i).length - 1))}_${i}`;
      const candidateExists = await this.prisma.profile.findUnique({
        where: { username: candidate },
      });
      if (!candidateExists) {
        return candidate;
      }
    }

    throw new ConflictException('Username already in use');
  }

  private async withFollowStatus<T extends { id: string }>(user: T, viewerId?: string) {
    if (!viewerId || user.id === viewerId) {
      return { ...user, isFollowing: false, isSelf: user.id === viewerId };
    }

    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      select: { id: true },
    });

    return { ...user, isFollowing: Boolean(follow), isSelf: false };
  }
}
