import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateMenuItemDto,
  CreateMenuSectionDto,
  CreateRestaurantDto,
  UpdateRestaurantDto,
} from './dto/restaurant.dto';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private delivery: DeliveryService) {}

  // ─── Restaurants ───

  @Post('restaurants')
  createRestaurant(@CurrentUser() user: any, @Body() dto: CreateRestaurantDto) {
    return this.delivery.createRestaurant(user.id, dto);
  }

  @Patch('restaurants/me')
  updateRestaurant(@CurrentUser() user: any, @Body() dto: UpdateRestaurantDto) {
    return this.delivery.updateRestaurant(user.id, dto);
  }

  @Get('restaurants/me')
  getMyRestaurant(@CurrentUser() user: any) {
    return this.delivery.getMyRestaurant(user.id);
  }

  @Public()
  @Get('restaurants')
  listRestaurants(@Query('city') city?: string) {
    return this.delivery.listRestaurants(city);
  }

  @Public()
  @Get('restaurants/:slug')
  getRestaurant(@Param('slug') slug: string) {
    return this.delivery.getRestaurantBySlug(slug);
  }

  // ─── Menu ───

  @Post('menu/sections')
  createSection(@CurrentUser() user: any, @Body() dto: CreateMenuSectionDto) {
    return this.delivery.createSection(user.id, dto);
  }

  @Delete('menu/sections/:id')
  deleteSection(@CurrentUser() user: any, @Param('id') id: string) {
    return this.delivery.deleteSection(user.id, id);
  }

  @Post('menu/items')
  createItem(@CurrentUser() user: any, @Body() dto: CreateMenuItemDto) {
    return this.delivery.createMenuItem(user.id, dto);
  }

  @Patch('menu/items/:id')
  updateItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateMenuItemDto>,
  ) {
    return this.delivery.updateMenuItem(user.id, id, dto);
  }

  @Delete('menu/items/:id')
  deleteItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.delivery.deleteMenuItem(user.id, id);
  }

  // ─── Orders ───

  @Post('orders')
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.delivery.createOrder(user.id, dto);
  }

  @Get('orders/my')
  myOrders(@CurrentUser() user: any) {
    return this.delivery.listMyOrders(user.id);
  }

  @Get('orders/restaurant')
  restaurantOrders(@CurrentUser() user: any) {
    return this.delivery.listRestaurantOrders(user.id);
  }

  @Get('orders/:id')
  getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.delivery.getOrder(user.id, id);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.delivery.updateOrderStatus(user.id, id, dto);
  }
}
