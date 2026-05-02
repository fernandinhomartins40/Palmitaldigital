import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostReactionType, PostType, PromotionKind } from '@palmital/types';
import { Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { ReactToPostDto } from './dto/react-to-post.dto';
import { SharePostDto } from './dto/share-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private buildPostInclude(viewerId?: string) {
    return Prisma.validator<Prisma.PostInclude>()({
      author: { include: { profile: true } },
      company: { select: { id: true, name: true, slug: true, logoUrl: true, isVerified: true } },
      classified: { include: { category: true } },
      promotion: {
        include: {
          products: {
            orderBy: { sortOrder: 'asc' },
            include: { product: true },
          },
        },
      },
      media: true,
      likes: viewerId
        ? {
            where: { userId: viewerId },
            take: 1,
          }
        : false,
      reactions: viewerId
        ? {
            where: { userId: viewerId },
            take: 1,
          }
        : false,
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { author: { include: { profile: true } } },
      },
      _count: {
        select: {
          reactions: true,
          likes: true,
          comments: true,
          shares: true,
        },
      },
    });
  }

  private async decoratePostsWithInteractions<
    T extends { id: string; likes?: any[]; reactions?: any[] },
  >(
    posts: T[],
  ) {
    if (!posts.length) return posts;

    const reactionGroups = await this.prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: posts.map((post) => post.id) } },
      _count: { _all: true },
    });

    return posts.map((post) => {
      const reactionSummary = reactionGroups
        .filter((group) => group.postId === post.id)
        .reduce<Record<string, number>>((summary, group) => {
          summary[group.type] = group._count._all;
          return summary;
        }, {});

      return {
        ...post,
        comments: (post as any).comments ? [...(post as any).comments].reverse() : [],
        viewerLiked: Boolean(post.likes?.length),
        viewerReaction: post.reactions?.[0]?.type ?? null,
        likes: undefined,
        reactionSummary,
        reactions: undefined,
      };
    });
  }

  private async getDecoratedPost(id: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.buildPostInclude(viewerId),
    });
    if (!post) throw new NotFoundException('Post not found');
    const [decorated] = await this.decoratePostsWithInteractions([post]);
    return decorated;
  }

  async createPost(authorId: string, dto: CreatePostDto) {
    if (dto.type === PostType.CLASSIFIED && !dto.classified) {
      throw new BadRequestException('classified data is required for CLASSIFIED type');
    }

    if (dto.type === PostType.PROMOTION && !dto.promotion) {
      throw new BadRequestException('promotion data is required for PROMOTION type');
    }

    let companyId: string | undefined;
    if (
      dto.type === PostType.BUSINESS ||
      dto.promotion?.kind === PromotionKind.COMPANY_PROFILE ||
      dto.promotion?.kind === PromotionKind.COMPANY_PRODUCTS
    ) {
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

      if (dto.promotion?.kind === PromotionKind.COMPANY_PRODUCTS) {
        const productIds = dto.promotion.productIds ?? [];
        if (!productIds.length) {
          throw new BadRequestException('company products promotion requires at least one product');
        }

        const ownedProducts = await this.prisma.product.findMany({
          where: {
            companyId: company.id,
            id: { in: productIds },
          },
          select: { id: true },
        });

        if (ownedProducts.length !== productIds.length) {
          throw new ForbiddenException('cannot promote products from another company');
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          companyId,
          type: dto.type as any,
          content: dto.content,
          media: dto.mediaIds?.length ? { connect: dto.mediaIds.map((id) => ({ id })) } : undefined,
          promotion:
            dto.type === PostType.PROMOTION && dto.promotion
              ? {
                  create: {
                    kind: dto.promotion.kind as any,
                    headline: dto.promotion.headline,
                    subtitle: dto.promotion.subtitle,
                    city: dto.promotion.city,
                    serviceArea: dto.promotion.serviceArea,
                    highlights: dto.promotion.highlights?.filter(Boolean) ?? [],
                    products:
                      dto.promotion.kind === PromotionKind.COMPANY_PRODUCTS &&
                      dto.promotion.productIds?.length
                        ? {
                            create: dto.promotion.productIds.map((productId, index) => ({
                              sortOrder: index,
                              product: { connect: { id: productId } },
                            })),
                          }
                        : undefined,
                  },
                }
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

      return tx.post.findUnique({
        where: { id: post.id },
        include: this.buildPostInclude(authorId),
      });
    });
  }

  async getFeed(query: FeedQueryDto, viewerId?: string) {
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
      include: this.buildPostInclude(viewerId),
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
    return { posts: await this.decoratePostsWithInteractions(posts), nextCursor };
  }

  async getUserPosts(userId: string, query: FeedQueryDto, viewerId?: string) {
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
      include: this.buildPostInclude(viewerId),
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
    return { posts: await this.decoratePostsWithInteractions(posts), nextCursor };
  }

  async getPost(id: string, viewerId?: string) {
    return this.getDecoratedPost(id, viewerId);
  }

  async reactToPost(postId: string, userId: string, dto: ReactToPostDto) {
    await this.ensurePostExists(postId);
    const type = dto.type;
    if (!type || type === PostReactionType.LIKE) {
      throw new BadRequestException('emoji reaction type is required');
    }

    const existing = await this.prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing?.type === type) {
      await this.prisma.postReaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await this.prisma.postReaction.update({
        where: { id: existing.id },
        data: { type: type as any },
      });
    } else {
      await this.prisma.postReaction.create({
        data: {
          postId,
          userId,
          type: type as any,
        },
      });
    }

    return this.getDecoratedPost(postId, userId);
  }

  async toggleLike(postId: string, userId: string) {
    await this.ensurePostExists(postId);
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
    }

    return this.getDecoratedPost(postId, userId);
  }

  async removeLike(postId: string, userId: string) {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });
    return this.getDecoratedPost(postId, userId);
  }

  async removeReaction(postId: string, userId: string) {
    await this.prisma.postReaction.deleteMany({ where: { postId, userId } });
    return this.getDecoratedPost(postId, userId);
  }

  async createComment(postId: string, authorId: string, dto: CreatePostCommentDto) {
    await this.ensurePostExists(postId);
    await this.prisma.postComment.create({
      data: {
        postId,
        authorId,
        content: dto.content.trim(),
      },
    });
    return this.getDecoratedPost(postId, authorId);
  }

  async getComments(postId: string) {
    await this.ensurePostExists(postId);
    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { include: { profile: true } } },
    });
  }

  async deleteComment(postId: string, commentId: string, userId: string, role: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment || comment.postId !== postId) throw new NotFoundException('Comment not found');

    if (comment.authorId !== userId && comment.post.authorId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    await this.prisma.postComment.delete({ where: { id: commentId } });
    return this.getDecoratedPost(postId, userId);
  }

  async sharePost(postId: string, userId: string, dto: SharePostDto) {
    await this.ensurePostExists(postId);
    await this.prisma.postShare.create({
      data: {
        postId,
        userId,
        target: dto.target,
      },
    });
    return this.getDecoratedPost(postId, userId);
  }

  async deletePost(id: string, userId: string, role: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.post.delete({ where: { id } });
  }

  private async ensurePostExists(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, isPublished: true },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}
