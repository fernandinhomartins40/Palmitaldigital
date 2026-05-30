import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApplyJournalistDto,
  CreateArticleCategoryDto,
  CreateArticleCommentDto,
  CreateArticleDto,
  ReviewApplicationDto,
  ReviewArticleDto,
  SubmitArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // ─── Journalist application ───

  async apply(userId: string, dto: ApplyJournalistDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'JOURNALIST') {
      throw new BadRequestException('Você já é jornalista credenciado');
    }

    const existing = await this.prisma.journalistApplication.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'PENDING') throw new BadRequestException('Solicitação em análise');
      if (existing.status === 'APPROVED') throw new BadRequestException('Já aprovado');
      return this.prisma.journalistApplication.update({
        where: { userId },
        data: { ...dto, status: 'PENDING', reviewedAt: null, reviewerId: null, notes: null },
      });
    }

    return this.prisma.journalistApplication.create({
      data: { userId, ...dto },
    });
  }

  async getMyApplication(userId: string) {
    return this.prisma.journalistApplication.findUnique({
      where: { userId },
    });
  }

  async listApplications() {
    return this.prisma.journalistApplication.findMany({
      where: { status: 'PENDING' },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewApplication(reviewerId: string, applicationId: string, dto: ReviewApplicationDto) {
    const app = await this.prisma.journalistApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Solicitação não encontrada');

    const updated = await this.prisma.journalistApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
        reviewerId,
        notes: dto.notes,
      },
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.user.update({
        where: { id: app.userId },
        data: { role: 'JOURNALIST' },
      });
    }

    return updated;
  }

  // ─── Categories ───

  async listCategories() {
    return this.prisma.articleCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(dto: CreateArticleCategoryDto) {
    let slug = slugify(dto.name);
    let i = 1;
    while (await this.prisma.articleCategory.findUnique({ where: { slug } })) {
      slug = `${slugify(dto.name)}-${i++}`;
    }
    return this.prisma.articleCategory.create({
      data: { name: dto.name, slug, color: dto.color },
    });
  }

  // ─── Articles ───

  async createArticle(authorId: string, dto: CreateArticleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (user?.role !== 'JOURNALIST' && user?.role !== 'ADMIN') {
      throw new ForbiddenException('Apenas jornalistas aprovados podem publicar');
    }

    let slug = slugify(dto.title);
    let i = 1;
    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${slugify(dto.title)}-${i++}`;
    }

    return this.prisma.article.create({
      data: {
        authorId,
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        body: dto.body,
        coverUrl: dto.coverUrl,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
      },
    });
  }

  async updateArticle(userId: string, articleId: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Artigo não encontrado');
    if (article.authorId !== userId) throw new ForbiddenException();

    return this.prisma.article.update({
      where: { id: articleId },
      data: dto as any,
    });
  }

  async submitArticle(userId: string, articleId: string, dto: SubmitArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException('Artigo não encontrado');
    if (article.authorId !== userId) throw new ForbiddenException();

    const status =
      dto.action === 'PUBLISH'
        ? 'PUBLISHED'
        : dto.action === 'DRAFT'
          ? 'DRAFT'
          : 'ARCHIVED';

    return this.prisma.article.update({
      where: { id: articleId },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' && !article.publishedAt ? new Date() : article.publishedAt,
      },
    });
  }

  async deleteArticle(userId: string, role: string, articleId: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException();
    if (article.authorId !== userId && role !== 'ADMIN') throw new ForbiddenException();
    return this.prisma.article.delete({ where: { id: articleId } });
  }

  async listPublic(filters: { categoryId?: string; tag?: string; featured?: boolean }) {
    return this.prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: filters.categoryId || undefined,
        tags: filters.tag ? { has: filters.tag } : undefined,
        isFeatured: filters.featured ? true : undefined,
      },
      include: {
        author: { include: { profile: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
  }

  async listMyArticles(userId: string) {
    return this.prisma.article.findMany({
      where: { authorId: userId },
      include: { category: true, _count: { select: { comments: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getArticleBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: { include: { profile: true } },
        category: true,
        _count: { select: { comments: true } },
      },
    });
    if (!article) throw new NotFoundException('Artigo não encontrado');
    if (article.status !== 'PUBLISHED') throw new NotFoundException();

    await this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async reviewArticle(adminId: string, articleId: string, dto: ReviewArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) throw new NotFoundException();

    return this.prisma.article.update({
      where: { id: articleId },
      data: {
        status: dto.status,
        isFeatured: dto.isFeatured ?? article.isFeatured,
        publishedAt:
          dto.status === 'PUBLISHED' && !article.publishedAt ? new Date() : article.publishedAt,
      },
    });
  }

  // ─── Comments ───

  async listComments(articleId: string) {
    return this.prisma.articleComment.findMany({
      where: { articleId, parentId: null },
      include: {
        author: { include: { profile: true } },
        replies: {
          include: { author: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(authorId: string, articleId: string, dto: CreateArticleCommentDto) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article || article.status !== 'PUBLISHED') throw new NotFoundException();

    return this.prisma.articleComment.create({
      data: {
        articleId,
        authorId,
        parentId: dto.parentId,
        content: dto.content,
      },
      include: { author: { include: { profile: true } } },
    });
  }

  async deleteComment(userId: string, role: string, articleId: string, commentId: string) {
    const comment = await this.prisma.articleComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.articleId !== articleId) throw new NotFoundException();

    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    const isAuthor = comment.authorId === userId;
    const isArticleOwner = article?.authorId === userId;
    if (!isAuthor && !isArticleOwner && role !== 'ADMIN') throw new ForbiddenException();

    return this.prisma.articleComment.delete({ where: { id: commentId } });
  }
}
