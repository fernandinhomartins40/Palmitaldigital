import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private requireAdmin(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('Acesso restrito ao administrador');
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboard(role: string) {
    this.requireAdmin(role);
    const [
      totalUsers,
      pendingCompanies,
      pendingRestaurants,
      pendingJournalists,
      pendingArticles,
      pendingDrivers,
      totalCompanies,
      totalRestaurants,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count({ where: { isVerified: false } }),
      this.prisma.restaurant.count({ where: { isVerified: false } }),
      this.prisma.journalistApplication.count({ where: { status: 'PENDING' } }),
      this.prisma.article.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.driver.count({ where: { isVerified: false } }),
      this.prisma.company.count(),
      this.prisma.restaurant.count(),
    ]);

    return {
      totalUsers,
      pendingCompanies,
      pendingRestaurants,
      pendingJournalists,
      pendingArticles,
      pendingDrivers,
      totalCompanies,
      totalRestaurants,
      totalPending: pendingCompanies + pendingRestaurants + pendingJournalists + pendingArticles + pendingDrivers,
    };
  }

  // ─── Usuários ─────────────────────────────────────────────────────────────

  async listUsers(role: string, q?: string, userRole?: string) {
    this.requireAdmin(role);
    return this.prisma.user.findMany({
      where: {
        ...(q ? { OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { profile: { displayName: { contains: q, mode: 'insensitive' } } },
        ] } : {}),
        ...(userRole ? { role: userRole as any } : {}),
      },
      include: { profile: { select: { displayName: true, avatarUrl: true, city: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateUserRole(adminRole: string, userId: string, newRole: string) {
    this.requireAdmin(adminRole);
    const validRoles = ['USER', 'BUSINESS_OWNER', 'JOURNALIST', 'DRIVER', 'RESTAURANT_OWNER', 'ADMIN'];
    if (!validRoles.includes(newRole)) throw new NotFoundException('Role inválida');
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      include: { profile: { select: { displayName: true } } },
    });
  }

  async toggleUserActive(adminRole: string, userId: string) {
    this.requireAdmin(adminRole);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  // ─── Empresas ─────────────────────────────────────────────────────────────

  async listCompanies(role: string, verified?: string) {
    this.requireAdmin(role);
    return this.prisma.company.findMany({
      where: verified !== undefined ? { isVerified: verified === 'true' } : {},
      include: {
        owner: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async verifyCompany(adminRole: string, companyId: string, verified: boolean) {
    this.requireAdmin(adminRole);
    return this.prisma.company.update({
      where: { id: companyId },
      data: { isVerified: verified },
      include: { owner: { include: { profile: { select: { displayName: true } } } } },
    });
  }

  // ─── Restaurantes / Delivery ──────────────────────────────────────────────

  async listRestaurants(role: string, verified?: string) {
    this.requireAdmin(role);
    return this.prisma.restaurant.findMany({
      where: verified !== undefined ? { isVerified: verified === 'true' } : {},
      include: {
        owner: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        _count: { select: { menu: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async verifyRestaurant(adminRole: string, restaurantId: string, verified: boolean) {
    this.requireAdmin(adminRole);
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isVerified: verified },
    });
  }

  // ─── Motoristas ───────────────────────────────────────────────────────────

  async listDrivers(role: string, verified?: string) {
    this.requireAdmin(role);
    return this.prisma.driver.findMany({
      where: verified !== undefined ? { isVerified: verified === 'true' } : {},
      include: {
        user: { include: { profile: { select: { displayName: true, avatarUrl: true, city: true } } } },
        _count: { select: { rides: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDriver(adminRole: string, driverId: string, verified: boolean) {
    this.requireAdmin(adminRole);
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { isVerified: verified },
      include: { user: true },
    });
    if (verified) {
      await this.prisma.user.update({
        where: { id: driver.userId },
        data: { role: 'DRIVER' },
      });
    }
    return driver;
  }

  // ─── Jornalistas ──────────────────────────────────────────────────────────

  async listJournalistApplications(role: string, status?: string) {
    this.requireAdmin(role);
    return this.prisma.journalistApplication.findMany({
      where: status ? { status: status as any } : {},
      include: {
        user: { include: { profile: { select: { displayName: true, avatarUrl: true, city: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewJournalistApplication(adminRole: string, adminId: string, appId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    this.requireAdmin(adminRole);
    const app = await this.prisma.journalistApplication.update({
      where: { id: appId },
      data: { status, reviewedAt: new Date(), reviewerId: adminId, notes },
      include: { user: true },
    });
    if (status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: app.userId }, data: { role: 'JOURNALIST' } });
    }
    return app;
  }

  // ─── Artigos ──────────────────────────────────────────────────────────────

  async listPendingArticles(role: string) {
    this.requireAdmin(role);
    return this.prisma.article.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        author: { include: { profile: { select: { displayName: true } } } },
        category: { select: { name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewArticle(adminRole: string, adminId: string, articleId: string, status: 'PUBLISHED' | 'REJECTED', isFeatured?: boolean) {
    this.requireAdmin(adminRole);
    return this.prisma.article.update({
      where: { id: articleId },
      data: {
        status,
        isFeatured: isFeatured ?? false,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  // ─── Categorias de notícia ────────────────────────────────────────────────

  async listNewsCategories(role: string) {
    this.requireAdmin(role);
    return this.prisma.articleCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createNewsCategory(role: string, data: { name: string; slug: string; color: string }) {
    this.requireAdmin(role);
    return this.prisma.articleCategory.create({ data: { ...data, sortOrder: 0 } });
  }

  // ─── Créditos & Assinaturas (estrutura futura) ────────────────────────────

  async listCreditPlans(role: string) {
    this.requireAdmin(role);
    // Placeholder — será populado quando implementarmos cobrança
    return {
      plans: [
        { id: 'starter', name: 'Starter', credits: 100, price: 29.90, description: 'Ideal para começar' },
        { id: 'pro', name: 'Pro', credits: 500, price: 99.90, description: 'Para quem quer crescer' },
        { id: 'business', name: 'Business', credits: 2000, price: 299.90, description: 'Máxima visibilidade' },
      ],
      subscriptions: [
        { id: 'empresa_verified', name: 'Empresa Verificada', price: 49.90, period: 'month', description: 'Selo de verificação + destaque no feed' },
        { id: 'portal_news', name: 'Portal de Notícias', price: 79.90, period: 'month', description: 'Portal com espaços de anúncio customizados' },
        { id: 'delivery_featured', name: 'Delivery em Destaque', price: 59.90, period: 'month', description: 'Restaurante em destaque no topo do delivery' },
      ],
      message: 'Sistema de cobrança será integrado em breve. Configure os planos aqui.',
    };
  }
}
