import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';

const storyInclude = {
  author: { include: { profile: true } },
  media: true,
  views: true,
  _count: { select: { views: true } },
} as const;

const STORY_IMAGE_WIDTH = 1080;
const STORY_IMAGE_HEIGHT = 1920;

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async createStory(authorId: string, dto: CreateStoryDto) {
    const media = await this.prisma.media.findUnique({ where: { id: dto.mediaId } });
    if (!media) throw new NotFoundException('Media not found');
    if (media.uploaderId !== authorId)
      throw new ForbiddenException('cannot use media from another user');

    if (media.type === 'IMAGE') {
      if (media.width !== STORY_IMAGE_WIDTH || media.height !== STORY_IMAGE_HEIGHT) {
        throw new BadRequestException('story images must be 1080x1920');
      }
    } else if (media.width && media.height && media.height <= media.width) {
      throw new BadRequestException('stories require vertical 9:16 media');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        authorId,
        mediaId: dto.mediaId,
        caption: dto.caption?.trim() || null,
        expiresAt,
      },
      include: storyInclude,
    });
  }

  async getStoryFeed(viewerId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const authorIds = [viewerId, ...following.map((item) => item.followingId)];

    const stories = await this.prisma.story.findMany({
      where: {
        authorId: { in: authorIds },
        isPublished: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: [{ authorId: 'asc' }, { createdAt: 'asc' }],
      include: storyInclude,
    });

    return this.groupStories(stories, viewerId);
  }

  async getUserStories(viewerId: string, userId: string) {
    const canView = await this.canViewUserStories(viewerId, userId);
    if (!canView) throw new ForbiddenException('follow this profile to view stories');

    const stories = await this.prisma.story.findMany({
      where: {
        authorId: userId,
        isPublished: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      include: storyInclude,
    });

    return stories.map((story) => this.decorateStory(story, viewerId));
  }

  async markViewed(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, isPublished: true, expiresAt: { gt: new Date() } },
      select: { id: true, authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');

    const canView = await this.canViewUserStories(viewerId, story.authorId);
    if (!canView) throw new ForbiddenException('follow this profile to view stories');

    await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      update: {},
      create: { storyId, viewerId },
    });

    return { viewed: true };
  }

  async deleteStory(storyId: string, userId: string, role: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.story.delete({ where: { id: storyId } });
  }

  private async canViewUserStories(viewerId: string, authorId: string) {
    if (viewerId === authorId) return true;
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: authorId } },
      select: { id: true },
    });
    return Boolean(follow);
  }

  private groupStories(stories: any[], viewerId: string) {
    const groups = new Map<string, any>();

    for (const story of stories) {
      const decorated = this.decorateStory(story, viewerId);
      const group = groups.get(story.authorId);

      if (group) {
        group.stories.push(decorated);
        group.hasUnseen ||= !decorated.seenByViewer;
      } else {
        groups.set(story.authorId, {
          author: story.author,
          hasUnseen: !decorated.seenByViewer,
          stories: [decorated],
        });
      }
    }

    return Array.from(groups.values());
  }

  private decorateStory(story: any, viewerId: string) {
    return {
      ...story,
      seenByViewer: story.views?.some((view: any) => view.viewerId === viewerId) ?? false,
      views: undefined,
    };
  }
}
