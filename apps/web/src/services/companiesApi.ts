import { api } from './api';

export type StoreSellMode = 'CONTACT' | 'CART' | 'BOTH';

export interface StoreProduct {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
}

export interface CompanyOrderItem {
  id: string;
  productId?: string | null;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface CompanyOrder {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  total: number;
  customerName: string;
  customerPhone?: string | null;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: CompanyOrderItem[];
  company?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    ownerId?: string;
    pixKey?: string | null;
    pixKeyType?: string | null;
    whatsapp?: string | null;
    phone?: string | null;
  };
  customer?: { profile: { displayName: string; avatarUrl?: string | null } };
}

export const companiesApi = {
  createOrder: (data: {
    companyId: string;
    items: Array<{ productId: string; quantity: number; notes?: string }>;
    customerName: string;
    customerPhone?: string;
    notes?: string;
  }) => api.post<CompanyOrder>('/companies/orders', data),

  getOrder: (id: string) => api.get<CompanyOrder>(`/companies/orders/${id}`),

  listMyOrders: () => api.get<CompanyOrder[]>('/companies/orders/my'),

  listCompanyOrders: () => api.get<CompanyOrder[]>('/companies/orders/company'),

  updateOrderStatus: (id: string, status: string, cancelReason?: string) =>
    api.patch<CompanyOrder>(`/companies/orders/${id}/status`, { status, cancelReason }),
};
