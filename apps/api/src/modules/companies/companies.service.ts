import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { slugify } from '@palmital/utils';
import { UploadStorageService } from '../../common/storage/upload-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private uploadStorage: UploadStorageService,
  ) {}

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

    return this.getMine(ownerId);
  }

  async getMine(ownerId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId },
      include: {
        owner: { include: { profile: true } },
        _count: {
          select: {
            posts: true,
            products: true,
          },
        },
        products: { orderBy: { createdAt: 'desc' } },
        posts: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            media: true,
            promotion: {
              include: {
                products: {
                  orderBy: { sortOrder: 'asc' },
                  include: { product: true },
                },
              },
            },
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
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async list(city?: string, category?: string) {
    return this.prisma.company.findMany({
      where: {
        isActive: true,
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
      },
      include: {
        owner: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        _count: {
          select: {
            posts: true,
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        owner: { include: { profile: true } },
        _count: {
          select: {
            posts: true,
            products: true,
          },
        },
        products: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
        posts: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            media: true,
            promotion: {
              include: {
                products: {
                  orderBy: { sortOrder: 'asc' },
                  include: { product: true },
                },
              },
            },
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
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateMine(ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.requireCompanyByOwner(ownerId);
    return this.update(company.slug, ownerId, dto);
  }

  async update(slug: string, ownerId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new NotFoundException();
    if (company.ownerId !== ownerId) throw new ForbiddenException();

    const data: UpdateCompanyDto = { ...dto };
    if (dto.name && dto.name !== company.name) {
      data.name = dto.name;
    }

    return this.prisma.company.update({ where: { slug }, data });
  }

  async uploadLogo(ownerId: string, file: Express.Multer.File) {
    const company = await this.requireCompanyByOwner(ownerId);
    const storedFile = await this.uploadStorage.storeCompanyLogo(file);

    try {
      const updated = await this.prisma.company.update({
        where: { id: company.id },
        data: { logoUrl: storedFile.url },
      });

      if (company.logoUrl && company.logoUrl !== storedFile.url) {
        await this.uploadStorage.removeByUrl(company.logoUrl);
      }

      return updated;
    } catch (error) {
      await this.uploadStorage.removeByUrl(storedFile.url);
      throw error;
    }
  }

  async removeLogo(ownerId: string) {
    const company = await this.requireCompanyByOwner(ownerId);
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { logoUrl: null },
    });

    await this.uploadStorage.removeByUrl(company.logoUrl);
    return updated;
  }

  async uploadCover(ownerId: string, file: Express.Multer.File) {
    const company = await this.requireCompanyByOwner(ownerId);
    const storedFile = await this.uploadStorage.storeCompanyCover(file);

    try {
      const updated = await this.prisma.company.update({
        where: { id: company.id },
        data: { coverUrl: storedFile.url },
      });

      if (company.coverUrl && company.coverUrl !== storedFile.url) {
        await this.uploadStorage.removeByUrl(company.coverUrl);
      }

      return updated;
    } catch (error) {
      await this.uploadStorage.removeByUrl(storedFile.url);
      throw error;
    }
  }

  async removeCover(ownerId: string) {
    const company = await this.requireCompanyByOwner(ownerId);
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { coverUrl: null },
    });

    await this.uploadStorage.removeByUrl(company.coverUrl);
    return updated;
  }

  async addProductMine(ownerId: string, dto: CreateProductDto) {
    const company = await this.requireCompanyByOwner(ownerId);
    return this.prisma.product.create({
      data: {
        companyId: company.id,
        ...dto,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async addProduct(slug: string, ownerId: string, dto: CreateProductDto) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company) throw new NotFoundException();
    if (company.ownerId !== ownerId) throw new ForbiddenException();

    return this.prisma.product.create({
      data: {
        companyId: company.id,
        ...dto,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async updateProductMine(ownerId: string, productId: string, dto: Partial<CreateProductDto>) {
    const company = await this.requireCompanyByOwner(ownerId);
    return this.updateProduct(company.slug, productId, ownerId, dto);
  }

  async updateProduct(
    slug: string,
    productId: string,
    ownerId: string,
    dto: Partial<CreateProductDto>,
  ) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company || company.ownerId !== ownerId) throw new ForbiddenException();

    await this.ensureProductOwner(company.id, productId);
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async uploadProductImage(ownerId: string, productId: string, file: Express.Multer.File) {
    const company = await this.requireCompanyByOwner(ownerId);
    const product = await this.ensureProductOwner(company.id, productId);
    const storedFile = await this.uploadStorage.storeProductImage(file);

    try {
      const updated = await this.prisma.product.update({
        where: { id: productId },
        data: { imageUrl: storedFile.url },
      });

      if (product.imageUrl && product.imageUrl !== storedFile.url) {
        await this.uploadStorage.removeByUrl(product.imageUrl);
      }

      return updated;
    } catch (error) {
      await this.uploadStorage.removeByUrl(storedFile.url);
      throw error;
    }
  }

  async removeProductImage(ownerId: string, productId: string) {
    const company = await this.requireCompanyByOwner(ownerId);
    const product = await this.ensureProductOwner(company.id, productId);
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: null },
    });

    await this.uploadStorage.removeByUrl(product.imageUrl);
    return updated;
  }

  async removeProductMine(ownerId: string, productId: string) {
    const company = await this.requireCompanyByOwner(ownerId);
    return this.removeProduct(company.slug, productId, ownerId);
  }

  async removeProduct(slug: string, productId: string, ownerId: string) {
    const company = await this.prisma.company.findUnique({ where: { slug } });
    if (!company || company.ownerId !== ownerId) throw new ForbiddenException();

    const product = await this.ensureProductOwner(company.id, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    await this.uploadStorage.removeByUrl(product.imageUrl);
  }

  private async requireCompanyByOwner(ownerId: string) {
    const company = await this.prisma.company.findUnique({ where: { ownerId } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private async ensureProductOwner(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
