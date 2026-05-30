import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
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

@Controller('news')
export class NewsController {
  constructor(private news: NewsService) {}

  // ─── Journalist applications ───

  @Post('apply')
  apply(@CurrentUser() user: any, @Body() dto: ApplyJournalistDto) {
    return this.news.apply(user.id, dto);
  }

  @Get('apply/me')
  myApplication(@CurrentUser() user: any) {
    return this.news.getMyApplication(user.id);
  }

  @Get('admin/applications')
  listApplications(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') {
      return { error: 'Forbidden' };
    }
    return this.news.listApplications();
  }

  @Patch('admin/applications/:id')
  reviewApplication(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    if (user.role !== 'ADMIN') return { error: 'Forbidden' };
    return this.news.reviewApplication(user.id, id, dto);
  }

  // ─── Categories ───

  @Public()
  @Get('categories')
  listCategories() {
    return this.news.listCategories();
  }

  @Post('admin/categories')
  createCategory(@CurrentUser() user: any, @Body() dto: CreateArticleCategoryDto) {
    if (user.role !== 'ADMIN') return { error: 'Forbidden' };
    return this.news.createCategory(dto);
  }

  // ─── Articles ───

  @Public()
  @Get()
  listArticles(
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
    @Query('featured') featured?: string,
  ) {
    return this.news.listPublic({
      categoryId,
      tag,
      featured: featured === 'true',
    });
  }

  @Get('mine')
  myArticles(@CurrentUser() user: any) {
    return this.news.listMyArticles(user.id);
  }

  @Public()
  @Get(':slug')
  getArticle(@Param('slug') slug: string) {
    return this.news.getArticleBySlug(slug);
  }

  @Post('articles')
  createArticle(@CurrentUser() user: any, @Body() dto: CreateArticleDto) {
    return this.news.createArticle(user.id, dto);
  }

  @Patch('articles/:id')
  updateArticle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.news.updateArticle(user.id, id, dto);
  }

  @Patch('articles/:id/submit')
  submitArticle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SubmitArticleDto,
  ) {
    return this.news.submitArticle(user.id, id, dto);
  }

  @Patch('admin/articles/:id/review')
  reviewArticle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewArticleDto,
  ) {
    if (user.role !== 'ADMIN') return { error: 'Forbidden' };
    return this.news.reviewArticle(user.id, id, dto);
  }

  @Delete('articles/:id')
  deleteArticle(@CurrentUser() user: any, @Param('id') id: string) {
    return this.news.deleteArticle(user.id, user.role, id);
  }

  // ─── Comments ───

  @Public()
  @Get(':articleId/comments')
  listComments(@Param('articleId') articleId: string) {
    return this.news.listComments(articleId);
  }

  @Post(':articleId/comments')
  createComment(
    @CurrentUser() user: any,
    @Param('articleId') articleId: string,
    @Body() dto: CreateArticleCommentDto,
  ) {
    return this.news.createComment(user.id, articleId, dto);
  }

  @Delete(':articleId/comments/:commentId')
  deleteComment(
    @CurrentUser() user: any,
    @Param('articleId') articleId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.news.deleteComment(user.id, user.role, articleId, commentId);
  }
}
