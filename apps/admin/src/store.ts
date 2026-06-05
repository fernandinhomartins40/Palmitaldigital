import { create } from 'zustand';
import Cookies from 'js-cookie';

const COOKIE_TOKEN = 'palmital_admin_token';
const COOKIE_USER  = 'palmital_admin_user';
const COOKIE_OPTS  = { expires: 7, sameSite: 'strict' as const, secure: location.protocol === 'https:' };

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  token: string | null;
  adminUser: AdminUser | null;
  setAuth: (token: string, user: AdminUser) => void;
  logout: () => void;
}

function loadFromCookies(): Pick<AdminAuthState, 'token' | 'adminUser'> {
  try {
    const token = Cookies.get(COOKIE_TOKEN) ?? null;
    const raw   = Cookies.get(COOKIE_USER);
    const adminUser: AdminUser | null = raw ? JSON.parse(raw) : null;
    return { token, adminUser };
  } catch {
    return { token: null, adminUser: null };
  }
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  ...loadFromCookies(),

  setAuth(token, adminUser) {
    Cookies.set(COOKIE_TOKEN, token, COOKIE_OPTS);
    Cookies.set(COOKIE_USER, JSON.stringify(adminUser), COOKIE_OPTS);
    set({ token, adminUser });
  },

  logout() {
    Cookies.remove(COOKIE_TOKEN);
    Cookies.remove(COOKIE_USER);
    set({ token: null, adminUser: null });
  },
}));
