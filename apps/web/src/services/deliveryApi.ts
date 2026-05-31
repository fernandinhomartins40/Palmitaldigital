import { api } from './api';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  category: string;
  address: string;
  minOrderValue: number;
  deliveryFee: number;
  estimatedTime: number;
  isOpen: boolean;
  pixKey?: string | null;
  pixKeyType?: string | null;
  menuItems?: MenuItem[];
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  available: boolean;
  categoryId?: string | null;
  menuCategory?: { name: string } | null;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  status: string;
  type: string;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress?: string | null;
  notes?: string | null;
  pixQrCode?: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: { name: string; logoUrl?: string | null };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    notes?: string | null;
    menuItem: { name: string; imageUrl?: string | null };
  }>;
}

export const deliveryApi = {
  listRestaurants: (params?: { category?: string; q?: string }) =>
    api.get<Restaurant[]>('/delivery/restaurants', { params }),

  getRestaurant: (slug: string) =>
    api.get<Restaurant>(`/delivery/restaurants/${slug}`),

  createOrder: (data: {
    restaurantId: string;
    items: OrderItem[];
    type: 'DELIVERY' | 'PICKUP';
    deliveryAddress?: string;
    notes?: string;
  }) => api.post<Order>('/delivery/orders', data),

  getOrder: (id: string) =>
    api.get<Order>(`/delivery/orders/${id}`),

  listMyOrders: () =>
    api.get<Order[]>('/delivery/orders/mine'),

  createRestaurant: (data: {
    name: string;
    description?: string;
    category: string;
    address: string;
    minOrderValue: number;
    deliveryFee: number;
    estimatedTime: number;
    pixKey: string;
    pixKeyType: string;
  }) => api.post<Restaurant>('/delivery/restaurants', data),

  updateRestaurant: (id: string, data: Partial<Restaurant>) =>
    api.patch<Restaurant>(`/delivery/restaurants/${id}`, data),

  createMenuItem: (restaurantId: string, data: {
    name: string;
    description?: string;
    price: number;
    categoryName?: string;
    imageUrl?: string;
  }) => api.post<MenuItem>(`/delivery/restaurants/${restaurantId}/menu`, data),

  updateMenuItem: (itemId: string, data: Partial<MenuItem>) =>
    api.patch<MenuItem>(`/delivery/menu/${itemId}`, data),

  deleteMenuItem: (itemId: string) =>
    api.delete(`/delivery/menu/${itemId}`),

  managerListOrders: (restaurantId: string) =>
    api.get<Order[]>(`/delivery/restaurants/${restaurantId}/orders`),

  updateOrderStatus: (orderId: string, status: string) =>
    api.patch<Order>(`/delivery/orders/${orderId}/status`, { status }),
};
