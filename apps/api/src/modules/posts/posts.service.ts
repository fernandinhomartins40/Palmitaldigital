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
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isVerified: true,
          sellMode: true,
          whatsapp: true,
          phone: true,
          category: true,
          city: true,
        },
      },
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
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: this.buildCommentInclude(viewerId),
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

  private buildCommentInclude(viewerId?: string) {
    return Prisma.validator<Prisma.PostCommentInclude>()({
      author: { include: { profile: true } },
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
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { include: { profile: true } },
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
          _count: {
            select: {
              likes: true,
              reactions: true,
              replies: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          reactions: true,
          replies: true,
        },
      },
    });
  }

  private buildFlatCommentInclude(viewerId?: string) {
    return Prisma.validator<Prisma.PostCommentInclude>()({
      author: { include: { profile: true } },
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
      _count: {
        select: {
          likes: true,
          reactions: true,
          replies: true,
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

    return Promise.all(posts.map(async (post) => {
      const reactionSummary = reactionGroups
        .filter((group) => group.postId === post.id)
        .reduce<Record<string, number>>((summary, group) => {
          summary[group.type] = group._count._all;
          return summary;
        }, {});

      return {
        ...post,
        comments: (post as any).comments
          ? await this.decorateComments([...(post as any).comments].reverse())
          : [],
        viewerLiked: Boolean(post.likes?.length),
        viewerReaction: post.reactions?.[0]?.type ?? null,
        likes: undefined,
        reactionSummary,
        reactions: undefined,
      };
    }));
  }

  private async decorateComments(comments: any[]) {
    const flattened = this.flattenComments(comments);
    if (!flattened.length) return comments;

    const reactionGroups = await this.prisma.postCommentReaction.groupBy({
      by: ['commentId', 'type'],
      where: { commentId: { in: flattened.map((comment) => comment.id) } },
      _count: { _all: true },
    });

    const decorate = (comment: any): any => {
      const reactionSummary = reactionGroups
        .filter((group) => group.commentId === comment.id)
        .reduce<Record<string, number>>((summary, group) => {
          summary[group.type] = group._count._all;
          return summary;
        }, {});

      return {
        ...comment,
        viewerLiked: Boolean(comment.likes?.length),
        viewerReaction: comment.reactions?.[0]?.type ?? null,
        reactionSummary,
        likes: undefined,
        reactions: undefined,
        replies: comment.replies?.map((reply: any) => decorate(reply)) ?? [],
      };
    };

    return comments.map((comment) => decorate(comment));
  }

  private flattenComments(comments: any[]): any[] {
    return comments.flatMap((comment) => [
      comment,
      ...(comment.replies?.length ? this.flattenComments(comment.replies) : []),
    ]);
  }

  private buildCommentTree(comments: any[]) {
    const byId = new Map<string, any>();
    const roots: any[] = [];

    for (const comment of comments) {
      byId.set(comment.id, { ...comment, replies: [] });
    }

    for (const comment of byId.values()) {
      if (comment.parentId && byId.has(comment.parentId)) {
        byId.get(comment.parentId).replies.push(comment);
      } else {
        roots.push(comment);
      }
    }

    return roots;
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

  async replyToComment(
    postId: string,
    parentCommentId: string,
    authorId: string,
    dto: CreatePostCommentDto,
  ) {
    await this.ensurePostExists(postId);
    await this.ensureCommentBelongsToPost(postId, parentCommentId);

    await this.prisma.postComment.create({
      data: {
        postId,
        parentId: parentCommentId,
        authorId,
        content: dto.content.trim(),
      },
    });

    return this.getDecoratedPost(postId, authorId);
  }

  async getComments(postId: string, viewerId?: string) {
    await this.ensurePostExists(postId);
    const comments = await this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: this.buildFlatCommentInclude(viewerId),
    });

    return this.decorateComments(this.buildCommentTree(comments));
  }

  async toggleCommentLike(postId: string, commentId: string, userId: string) {
    await this.ensureCommentBelongsToPost(postId, commentId);
    const existing = await this.prisma.postCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await this.prisma.postCommentLike.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.postCommentLike.create({ data: { commentId, userId } });
    }

    return this.getComments(postId, userId);
  }

  async reactToComment(postId: string, commentId: string, userId: string, dto: ReactToPostDto) {
    await this.ensureCommentBelongsToPost(postId, commentId);
    const type = dto.type;
    if (!type || type === PostReactionType.LIKE) {
      throw new BadRequestException('emoji reaction type is required');
    }

    const existing = await this.prisma.postCommentReaction.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing?.type === type) {
      await this.prisma.postCommentReaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await this.prisma.postCommentReaction.update({
        where: { id: existing.id },
        data: { type: type as any },
      });
    } else {
      await this.prisma.postCommentReaction.create({
        data: { commentId, userId, type: type as any },
      });
    }

    return this.getComments(postId, userId);
  }

  async removeCommentReaction(postId: string, commentId: string, userId: string) {
    await this.ensureCommentBelongsToPost(postId, commentId);
    await this.prisma.postCommentReaction.deleteMany({ where: { commentId, userId } });
    return this.getComments(postId, userId);
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

  private async ensureCommentBelongsToPost(postId: string, commentId: string) {
    const comment = await this.prisma.postComment.findFirst({
      where: { id: commentId, postId },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }
}
