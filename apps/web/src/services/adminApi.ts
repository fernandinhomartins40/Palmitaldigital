import { api } from './api';

export interface AdminDashboard {
  totalUsers: number;
  pendingCompanies: number;
  pendingRestaurants: number;
  pendingJournalists: number;
  pendingArticles: number;
  pendingDrivers: number;
  totalCompanies: number;
  totalRestaurants: number;
  totalPending: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: { displayName: string; avatarUrl?: string | null; city?: string | null } | null;
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  city?: string | null;
  phone?: string | null;
  isVerified: boolean;
  createdAt: string;
  owner: { id: string; email: string; profile?: { displayName: string; avatarUrl?: string | null } | null };
  _count: { products: number; orders: number };
}

export interface AdminRestaurant {
  id: string;
  name: string;
  slug: string;
  cuisine?: string | null;
  city?: string | null;
  phone?: string | null;
  isVerified: boolean;
  isOpen: boolean;
  createdAt: string;
  owner: { id: string; email: string; profile?: { displayName: string; avatarUrl?: string | null } | null };
  _count: { menu: number; orders: number };
}

export interface AdminDriver {
  id: string;
  isVerified: boolean;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  createdAt: string;
  user: { id: string; email: string; profile?: { displayName: string; avatarUrl?: string | null; city?: string | null } | null };
  _count: { rides: number };
}

export interface AdminJournalistApp {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bio: string;
  portfolio: string;
  motivation: string;
  notes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user: { id: string; email: string; profile?: { displayName: string; avatarUrl?: string | null; city?: string | null } | null };
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  status: string;
  createdAt: string;
  author: { id: string; profile?: { displayName: string } | null };
  category?: { name: string; color: string } | null;
}

export const adminApi = {
  getDashboard: () => api.get<AdminDashboard>('/admin/dashboard'),

  // Usuários
  listUsers: (q?: string, role?: string) => api.get<AdminUser[]>('/admin/users', { params: { q, role } }),
  updateRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleActive: (id: string) => api.patch(`/admin/users/${id}/toggle-active`, {}),

  // Empresas
  listCompanies: (verified?: string) => api.get<AdminCompany[]>('/admin/companies', { params: { verified } }),
  verifyCompany: (id: string, verified: boolean) => api.patch(`/admin/companies/${id}/verify`, { verified }),

  // Restaurantes
  listRestaurants: (verified?: string) => api.get<AdminRestaurant[]>('/admin/restaurants', { params: { verified } }),
  verifyRestaurant: (id: string, verified: boolean) => api.patch(`/admin/restaurants/${id}/verify`, { verified }),

  // Motoristas
  listDrivers: (verified?: string) => api.get<AdminDriver[]>('/admin/drivers', { params: { verified } }),
  verifyDriver: (id: string, verified: boolean) => api.patch(`/admin/drivers/${id}/verify`, { verified }),

  // Jornalistas
  listJournalistApps: (status?: string) => api.get<AdminJournalistApp[]>('/admin/journalist-applications', { params: { status } }),
  reviewJournalistApp: (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) =>
    api.patch(`/admin/journalist-applications/${id}/review`, { status, notes }),

  // Artigos
  listPendingArticles: () => api.get<AdminArticle[]>('/admin/articles/pending'),
  reviewArticle: (id: string, status: 'PUBLISHED' | 'REJECTED', isFeatured?: boolean) =>
    api.patch(`/admin/articles/${id}/review`, { status, isFeatured }),

  // Créditos
  getCreditPlans: () => api.get<any>('/admin/credit-plans'),
};
