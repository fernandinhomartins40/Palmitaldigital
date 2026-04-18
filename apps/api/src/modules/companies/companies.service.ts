import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { slugify } from '@palmital/utils';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({ where: { ownerId } });
    if (existing) throw new ConflictException('User already has a company');

    const slug = slugify(dto.name);
    const slugExists = await this.prisma.company.findUnique({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const company = await this.prisma.company.create({
      data: { ownerId, ...dto, slug: finalSlug },
    });

    await this.prisma.user.update({
      where: { id: ownerId },
      data: { role: 'BUSINESS_OWNER' },
    });

    return company;
  }

  async list(city?: string, category?: string) {
    return this.prisma.company.findMany({
      where: {
        isActive: true,
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      },
      include: { owner: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async getBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        owner: { include: { profile: true } },
        products: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
        posts: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { media: true },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(slug: string, ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new NotFoundException();
    if (company.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.company.update({ where: { slug }, data: dto });
  }

  async addProduct(slug: string, ownerId: string, dto: CreateProductDto) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new NotFoundException();
    if (company.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.product.create({ data: { companyId: company.id, ...dto } });
  }

  async updateProduct(slug: string, productId: string, ownerId: string, dto: Partial<CreateProductDto>) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company || company.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async removeProduct(slug: string, productId: string, ownerId: string) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company || company.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.product.delete({ where: { id: productId } });
  }
}
