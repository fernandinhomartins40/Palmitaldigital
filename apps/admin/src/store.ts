import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  token: string | null;
  adminUser: { id: string; email: string; role: string } | null;
  setAuth: (token: string, user: AdminAuthState['adminUser']) => void;
  logout: () => void;
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      adminUser: null,
      setAuth: (token, adminUser) => set({ token, adminUser }),
      logout: () => set({ token: null, adminUser: null }),
    }),
    { name: 'palmital-admin-auth' },
  ),
);
