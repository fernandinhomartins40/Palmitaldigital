import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { slugify } from '@palmital/utils';
import { Prisma } from '../../../generated/prisma';
import { UploadStorageService } from '../../common/storage/upload-storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyOrderDto, UpdateCompanyOrderStatusDto } from './dto/company-order.dto';

const COMPANY_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'COMPLETED', 'CANCELLED'],
  PREPARING: ['READY', 'COMPLETED', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

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
        products: {
          where: { isAvailable: true },
          orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        },
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

  // ─── Storefront orders ───

  async createOrder(customerId: string, dto: CreateCompanyOrderDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) throw new NotFoundException('Loja não encontrada');
    if (!company.isActive) throw new BadRequestException('Loja indisponível no momento');
    if (company.sellMode === 'CONTACT') {
      throw new BadRequestException('Esta loja não aceita pedidos pelo app');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId: dto.companyId, isAvailable: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('Algum produto não está disponível');
    }

    const itemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.price == null) {
        throw new BadRequestException(`Produto "${product.name}" não tem preço definido`);
      }
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        notes: item.notes,
      };
    });

    const subtotal = itemsData.reduce(
      (acc, item) => acc.add(new Prisma.Decimal(item.price).mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    return this.prisma.companyOrder.create({
      data: {
        companyId: dto.companyId,
        customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        subtotal,
        total: subtotal,
        items: { create: itemsData },
      },
      include: {
        items: true,
        company: {
          select: { id: true, name: true, slug: true, logoUrl: true, pixKey: true, pixKeyType: true, whatsapp: true, phone: true },
        },
      },
    });
  }

  async listMyOrders(customerId: string) {
    return this.prisma.companyOrder.findMany({
      where: { customerId },
      include: {
        items: true,
        company: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listCompanyOrders(ownerId: string) {
    const company = await this.requireCompanyByOwner(ownerId);
    return this.prisma.companyOrder.findMany({
      where: { companyId: company.id },
      include: {
        items: true,
        customer: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.companyOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        company: {
          select: { id: true, name: true, slug: true, logoUrl: true, ownerId: true, pixKey: true, pixKeyType: true, whatsapp: true, phone: true },
        },
        customer: { include: { profile: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const isOwner = order.company.ownerId === userId;
    const isCustomer = order.customerId === userId;
    if (!isOwner && !isCustomer) throw new ForbiddenException();

    return order;
  }

  async updateOrderStatus(userId: string, orderId: string, dto: UpdateCompanyOrderStatusDto) {
    const order = await this.prisma.companyOrder.findUnique({
      where: { id: orderId },
      include: { company: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const isOwner = order.company.ownerId === userId;
    const isCustomer = order.customerId === userId;

    if (dto.status === 'CANCELLED') {
      if (!isOwner && !isCustomer) throw new ForbiddenException();
    } else if (!isOwner) {
      throw new ForbiddenException('Apenas a loja atualiza o status');
    }

    const allowed = COMPANY_ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Não pode mudar de ${order.status} para ${dto.status}`);
    }

    const data: Prisma.CompanyOrderUpdateInput = { status: dto.status as any };
    if (dto.status === 'ACCEPTED') data.acceptedAt = new Date();
    if (dto.status === 'COMPLETED') data.completedAt = new Date();
    if (dto.status === 'CANCELLED') {
      data.cancelledAt = new Date();
      data.cancelReason = dto.cancelReason;
    }

    return this.prisma.companyOrder.update({
      where: { id: orderId },
      data,
      include: {
        items: true,
        customer: { include: { profile: true } },
      },
    });
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
