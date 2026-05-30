import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma';
import {
  CreateMenuItemDto,
  CreateMenuSectionDto,
  CreateRestaurantDto,
  UpdateRestaurantDto,
} from './dto/restaurant.dto';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['ON_THE_WAY', 'DELIVERED', 'CANCELLED'],
  ON_THE_WAY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

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
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // ─── Restaurant ───

  async createRestaurant(userId: string, dto: CreateRestaurantDto) {
    const existing = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (existing) throw new BadRequestException('Você já possui um restaurante');

    let slug = slugify(dto.name);
    let i = 1;
    while (await this.prisma.restaurant.findUnique({ where: { slug } })) {
      slug = `${slugify(dto.name)}-${i++}`;
    }

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ownerId: userId,
        name: dto.name,
        slug,
        description: dto.description,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        cuisine: dto.cuisine,
        deliveryFee: dto.deliveryFee,
        minOrder: dto.minOrder,
        avgPrepMinutes: dto.avgPrepMinutes ?? 30,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'RESTAURANT_OWNER' },
    });

    return restaurant;
  }

  async updateRestaurant(userId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    return this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { ...dto },
    });
  }

  async getMyRestaurant(userId: string) {
    return this.prisma.restaurant.findUnique({
      where: { ownerId: userId },
      include: {
        sections: { include: { items: true }, orderBy: { sortOrder: 'asc' } },
        menu: { where: { sectionId: null }, orderBy: { sortOrder: 'asc' } },
        owner: { select: { id: true, pixKey: true, pixKeyType: true } },
      },
    });
  }

  async listRestaurants(city?: string) {
    return this.prisma.restaurant.findMany({
      where: city ? { city: { contains: city, mode: 'insensitive' } } : undefined,
      orderBy: [{ isOpen: 'desc' }, { ratingAvg: 'desc' }],
    });
  }

  async getRestaurantBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        sections: {
          include: { items: { where: { isAvailable: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        menu: {
          where: { sectionId: null, isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
        owner: { select: { id: true, pixKey: true, pixKeyType: true } },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    return restaurant;
  }

  // ─── Menu ───

  async createSection(userId: string, dto: CreateMenuSectionDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    return this.prisma.menuSection.create({
      data: { restaurantId: restaurant.id, name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async deleteSection(userId: string, sectionId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    const section = await this.prisma.menuSection.findUnique({ where: { id: sectionId } });
    if (!section || section.restaurantId !== restaurant.id) throw new ForbiddenException();

    return this.prisma.menuSection.delete({ where: { id: sectionId } });
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    return this.prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        sectionId: dto.sectionId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async updateMenuItem(userId: string, itemId: string, dto: Partial<CreateMenuItemDto>) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item || item.restaurantId !== restaurant.id) throw new ForbiddenException();

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: dto as any,
    });
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item || item.restaurantId !== restaurant.id) throw new ForbiddenException();

    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }

  // ─── Orders ───

  async createOrder(customerId: string, dto: CreateOrderDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    if (!restaurant.isOpen) throw new BadRequestException('Restaurante fechado');

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
    });
    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Algum item não está disponível');
    }

    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        notes: item.notes,
      };
    });

    const subtotal = orderItemsData.reduce(
      (acc, item) => acc.add(new Prisma.Decimal(item.price).mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const deliveryFee =
      dto.type === 'DELIVERY' && restaurant.deliveryFee
        ? new Prisma.Decimal(restaurant.deliveryFee)
        : new Prisma.Decimal(0);

    if (restaurant.minOrder && subtotal.lt(restaurant.minOrder)) {
      throw new BadRequestException(`Pedido mínimo: R$ ${restaurant.minOrder}`);
    }

    return this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId,
        type: dto.type,
        subtotal,
        deliveryFee,
        total: subtotal.add(deliveryFee),
        deliveryAddress: dto.deliveryAddress,
        deliveryNotes: dto.deliveryNotes,
        customerNotes: dto.customerNotes,
        items: { create: orderItemsData },
      },
      include: {
        items: true,
        restaurant: { include: { owner: { select: { pixKey: true, pixKeyType: true } } } },
      },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const isOwner = order.restaurant.ownerId === userId;
    const isCustomer = order.customerId === userId;

    if (dto.status === 'CANCELLED') {
      if (!isOwner && !isCustomer) throw new ForbiddenException();
    } else {
      if (!isOwner) throw new ForbiddenException('Apenas o restaurante atualiza o status');
    }

    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Não pode mudar de ${order.status} para ${dto.status}`);
    }

    const data: any = { status: dto.status };
    if (dto.status === 'ACCEPTED') data.acceptedAt = new Date();
    if (dto.status === 'PREPARING') data.preparingAt = new Date();
    if (dto.status === 'READY') data.readyAt = new Date();
    if (dto.status === 'DELIVERED') data.deliveredAt = new Date();
    if (dto.status === 'CANCELLED') {
      data.cancelledAt = new Date();
      data.cancelReason = dto.cancelReason;
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        items: true,
        restaurant: { include: { owner: { select: { pixKey: true, pixKeyType: true } } } },
        customer: { include: { profile: true } },
      },
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: { include: { owner: { select: { id: true, pixKey: true, pixKeyType: true } } } },
        customer: { include: { profile: true } },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    const isOwner = order.restaurant.ownerId === userId;
    const isCustomer = order.customerId === userId;
    if (!isOwner && !isCustomer) throw new ForbiddenException();

    return order;
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: true,
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listRestaurantOrders(userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId: userId } });
    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');

    return this.prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        items: true,
        customer: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
