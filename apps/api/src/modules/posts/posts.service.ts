import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostType } from '@palmital/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private get postInclude() {
    return {
      author: { include: { profile: true } },
      company: { select: { id: true, name: true, slug: true, logoUrl: true, isVerified: true } },
      classified: { include: { category: true } },
      media: true,
    };
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    if (dto.type === PostType.CLASSIFIED && !dto.classified) {
      throw new BadRequestException('classified data is required for CLASSIFIED type');
    }

    let companyId: string | undefined;
    if (dto.type === PostType.BUSINESS) {
      const company = dto.companyId
        ? await this.prisma.company.findUnique({ where: { id: dto.companyId } })
        : await this.prisma.company.findUnique({ where: { ownerId: authorId } });

      if (!company) {
        throw new BadRequestException('business posts require an owned company');
      }

      if (company.ownerId !== authorId) {
        throw new ForbiddenException('cannot publish for another company');
      }

      companyId = company.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          companyId,
          type: dto.type,
          content: dto.content,
          media: dto.mediaIds?.length
            ? { connect: dto.mediaIds.map((id) => ({ id })) }
            : undefined,
        },
      });

      if (dto.type === PostType.CLASSIFIED && dto.classified) {
        await tx.classified.create({
          data: {
            postId: post.id,
            authorId,
            title: dto.classified.title,
            description: dto.classified.description,
            price: dto.classified.price,
            isFree: dto.classified.isFree ?? false,
            categoryId: dto.classified.categoryId,
            city: dto.classified.city,
          },
        });
      }

      return tx.post.findUnique({ where: { id: post.id }, include: this.postInclude });
    });
  }

  async getFeed(query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    let cursorFilter = {};

    if (query.cursor) {
      const cursorPost = await this.prisma.post.findUnique({ where: { id: query.cursor } });
      if (cursorPost) {
        cursorFilter = { createdAt: { lt: cursorPost.createdAt } };
      }
    }

    const posts = await this.prisma.post.findMany({
      where: { isPublished: true, ...cursorFilter },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: this.postInclude,
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
    return { posts, nextCursor };
  }

  async getUserPosts(userId: string, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    let cursorFilter = {};

    if (query.cursor) {
      const cursorPost = await this.prisma.post.findUnique({ where: { id: query.cursor } });
      if (cursorPost) {
        cursorFilter = { createdAt: { lt: cursorPost.createdAt } };
      }
    }

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        isPublished: true,
        ...cursorFilter,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: this.postInclude,
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
    return { posts, nextCursor };
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postInclude,
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async deletePost(id: string, userId: string, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.post.delete({ where: { id } });
  }
}
