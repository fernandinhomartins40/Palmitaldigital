import axios from 'axios';
import { useAdminAuth } from './store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAdminAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAdminAuth.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: any }>('/auth/login', { email, password }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface Dashboard {
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

export const adminApi = {
  getDashboard:          ()                                      => api.get<Dashboard>('/admin/dashboard'),
  listUsers:             (q?: string, role?: string)             => api.get<any[]>('/admin/users', { params: { q, role } }),
  updateRole:            (id: string, role: string)              => api.patch(`/admin/users/${id}/role`, { role }),
  toggleActive:          (id: string)                            => api.patch(`/admin/users/${id}/toggle-active`, {}),
  listCompanies:         (verified?: string)                     => api.get<any[]>('/admin/companies', { params: { verified } }),
  verifyCompany:         (id: string, verified: boolean)         => api.patch(`/admin/companies/${id}/verify`, { verified }),
  listRestaurants:       (verified?: string)                     => api.get<any[]>('/admin/restaurants', { params: { verified } }),
  verifyRestaurant:      (id: string, verified: boolean)         => api.patch(`/admin/restaurants/${id}/verify`, { verified }),
  listDrivers:           (verified?: string)                     => api.get<any[]>('/admin/drivers', { params: { verified } }),
  verifyDriver:          (id: string, verified: boolean)         => api.patch(`/admin/drivers/${id}/verify`, { verified }),
  listJournalistApps:    (status?: string)                       => api.get<any[]>('/admin/journalist-applications', { params: { status } }),
  reviewJournalistApp:   (id: string, status: string, notes?: string) => api.patch(`/admin/journalist-applications/${id}/review`, { status, notes }),
  listPendingArticles:   ()                                      => api.get<any[]>('/admin/articles/pending'),
  reviewArticle:         (id: string, status: string, isFeatured?: boolean) => api.patch(`/admin/articles/${id}/review`, { status, isFeatured }),
  getCreditPlans:        ()                                      => api.get<any>('/admin/credit-plans'),
};
