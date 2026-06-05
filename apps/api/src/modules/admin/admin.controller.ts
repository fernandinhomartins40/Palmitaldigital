import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  dashboard(@CurrentUser() user: any) {
    return this.admin.getDashboard(user.role);
  }

  // ─── Usuários ─────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(@CurrentUser() user: any, @Query('q') q?: string, @Query('role') role?: string) {
    return this.admin.listUsers(user.role, q, role);
  }

  @Patch('users/:id/role')
  updateRole(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { role: string }) {
    return this.admin.updateUserRole(user.role, id, body.role);
  }

  @Patch('users/:id/toggle-active')
  toggleActive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.admin.toggleUserActive(user.role, id);
  }

  // ─── Empresas ─────────────────────────────────────────────────────────────

  @Get('companies')
  listCompanies(@CurrentUser() user: any, @Query('verified') verified?: string) {
    return this.admin.listCompanies(user.role, verified);
  }

  @Patch('companies/:id/verify')
  verifyCompany(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.admin.verifyCompany(user.role, id, body.verified);
  }

  // ─── Restaurantes / Delivery ──────────────────────────────────────────────

  @Get('restaurants')
  listRestaurants(@CurrentUser() user: any, @Query('verified') verified?: string) {
    return this.admin.listRestaurants(user.role, verified);
  }

  @Patch('restaurants/:id/verify')
  verifyRestaurant(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.admin.verifyRestaurant(user.role, id, body.verified);
  }

  // ─── Motoristas ───────────────────────────────────────────────────────────

  @Get('drivers')
  listDrivers(@CurrentUser() user: any, @Query('verified') verified?: string) {
    return this.admin.listDrivers(user.role, verified);
  }

  @Patch('drivers/:id/verify')
  verifyDriver(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.admin.verifyDriver(user.role, id, body.verified);
  }

  // ─── Jornalistas ──────────────────────────────────────────────────────────

  @Get('journalist-applications')
  listApplications(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.admin.listJournalistApplications(user.role, status);
  }

  @Patch('journalist-applications/:id/review')
  reviewApplication(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; notes?: string },
  ) {
    return this.admin.reviewJournalistApplication(user.role, user.id, id, body.status, body.notes);
  }

  // ─── Artigos ──────────────────────────────────────────────────────────────

  @Get('articles/pending')
  listPendingArticles(@CurrentUser() user: any) {
    return this.admin.listPendingArticles(user.role);
  }

  @Patch('articles/:id/review')
  reviewArticle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status: 'PUBLISHED' | 'REJECTED'; isFeatured?: boolean },
  ) {
    return this.admin.reviewArticle(user.role, user.id, id, body.status, body.isFeatured);
  }

  // ─── Categorias de notícia ────────────────────────────────────────────────

  @Get('news-categories')
  listNewsCategories(@CurrentUser() user: any) {
    return this.admin.listNewsCategories(user.role);
  }

  @Post('news-categories')
  createNewsCategory(@CurrentUser() user: any, @Body() body: { name: string; slug: string; color: string }) {
    return this.admin.createNewsCategory(user.role, body);
  }

  // ─── Créditos & Assinaturas ───────────────────────────────────────────────

  @Get('credit-plans')
  creditPlans(@CurrentUser() user: any) {
    return this.admin.listCreditPlans(user.role);
  }
}
