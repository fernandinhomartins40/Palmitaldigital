import { api } from './api';

// Prisma Decimal serializes as string in JSON; treat money fields as string|number.
type Money = string | number;

export interface MenuItem {
  id: string;
  restaurantId: string;
  sectionId?: string | null;
  name: string;
  description?: string | null;
  price: Money;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface MenuSection {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  cuisine?: string | null;
  isOpen: boolean;
  isVerified: boolean;
  deliveryFee?: Money | null;
  minOrder?: Money | null;
  avgPrepMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  // Included on getBySlug / getMine
  sections?: MenuSection[];
  menu?: MenuItem[];
  owner?: { id: string; pixKey?: string | null; pixKeyType?: string | null };
}

export interface OrderItem {
  id: string;
  menuItemId?: string | null;
  name: string;
  price: Money;
  quantity: number;
  notes?: string | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  status: OrderStatus;
  type: 'DELIVERY' | 'PICKUP';
  subtotal: Money;
  deliveryFee: Money;
  total: Money;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
  customerNotes?: string | null;
  paymentMethod: string;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    owner?: { pixKey?: string | null; pixKeyType?: string | null };
  };
  customer?: { profile: { displayName: string; avatarUrl?: string | null } };
}

export interface CreateOrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export const deliveryApi = {
  // ─── Restaurants ───
  listRestaurants: (params?: { city?: string }) =>
    api.get<Restaurant[]>('/delivery/restaurants', { params }),

  getRestaurant: (slug: string) =>
    api.get<Restaurant>(`/delivery/restaurants/${slug}`),

  getMyRestaurant: () =>
    api.get<Restaurant>('/delivery/restaurants/me'),

  createRestaurant: (data: {
    name: string;
    description?: string;
    phone?: string;
    address?: string;
    city?: string;
    cuisine?: string;
    deliveryFee?: number;
    minOrder?: number;
    avgPrepMinutes?: number;
  }) => api.post<Restaurant>('/delivery/restaurants', data),

  updateMyRestaurant: (data: Partial<{
    name: string;
    description: string;
    phone: string;
    address: string;
    city: string;
    cuisine: string;
    deliveryFee: number;
    minOrder: number;
    avgPrepMinutes: number;
    isOpen: boolean;
  }>) => api.patch<Restaurant>('/delivery/restaurants/me', data),

  // ─── Menu ───
  createSection: (data: { name: string; sortOrder?: number }) =>
    api.post<MenuSection>('/delivery/menu/sections', data),

  deleteSection: (id: string) =>
    api.delete(`/delivery/menu/sections/${id}`),

  createMenuItem: (data: {
    name: string;
    description?: string;
    price: number;
    sectionId?: string;
    isAvailable?: boolean;
    imageUrl?: string;
  }) => api.post<MenuItem>('/delivery/menu/items', data),

  updateMenuItem: (id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    sectionId: string;
    isAvailable: boolean;
    imageUrl: string;
  }>) => api.patch<MenuItem>(`/delivery/menu/items/${id}`, data),

  deleteMenuItem: (id: string) =>
    api.delete(`/delivery/menu/items/${id}`),

  // ─── Orders ───
  createOrder: (data: {
    restaurantId: string;
    items: CreateOrderItem[];
    type: 'DELIVERY' | 'PICKUP';
    deliveryAddress?: string;
    deliveryNotes?: string;
    customerNotes?: string;
  }) => api.post<Order>('/delivery/orders', data),

  getOrder: (id: string) =>
    api.get<Order>(`/delivery/orders/${id}`),

  listMyOrders: () =>
    api.get<Order[]>('/delivery/orders/my'),

  listRestaurantOrders: () =>
    api.get<Order[]>('/delivery/orders/restaurant'),

  updateOrderStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch<Order>(`/delivery/orders/${id}/status`, { status, cancelReason }),
};
