import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreProduct } from '../services/companiesApi';

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export interface CompanyCart {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyPhone: string | null;
  items: CartItem[];
}

interface CompanyCartState {
  carts: Record<string, CompanyCart>; // keyed by companyId
  addItem: (
    companyId: string,
    companyName: string,
    companySlug: string,
    companyPhone: string | null,
    product: StoreProduct,
    quantity?: number,
  ) => void;
  removeItem: (companyId: string, productId: string) => void;
  updateQuantity: (companyId: string, productId: string, quantity: number) => void;
  clearCompanyCart: (companyId: string) => void;
  clearAllCarts: () => void;
  totalForCompany: (companyId: string) => number;
  totalItemCount: () => number;
}

export const useCompanyCartStore = create<CompanyCartState>()(
  persist(
    (set, get) => ({
      carts: {},

      addItem: (companyId, companyName, companySlug, companyPhone, product, quantity = 1) => {
        set((s) => {
          const existing = s.carts[companyId];
          if (existing) {
            const existingItem = existing.items.find((i) => i.product.id === product.id);
            return {
              carts: {
                ...s.carts,
                [companyId]: {
                  ...existing,
                  items: existingItem
                    ? existing.items.map((i) =>
                        i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
                      )
                    : [...existing.items, { product, quantity }],
                },
              },
            };
          }
          return {
            carts: {
              ...s.carts,
              [companyId]: { companyId, companyName, companySlug, companyPhone, items: [{ product, quantity }] },
            },
          };
        });
      },

      removeItem: (companyId, productId) => {
        set((s) => {
          const cart = s.carts[companyId];
          if (!cart) return s;
          const items = cart.items.filter((i) => i.product.id !== productId);
          if (items.length === 0) {
            const { [companyId]: _, ...rest } = s.carts;
            return { carts: rest };
          }
          return { carts: { ...s.carts, [companyId]: { ...cart, items } } };
        });
      },

      updateQuantity: (companyId, productId, quantity) => {
        set((s) => {
          const cart = s.carts[companyId];
          if (!cart) return s;
          if (quantity <= 0) {
            const items = cart.items.filter((i) => i.product.id !== productId);
            if (items.length === 0) {
              const { [companyId]: _, ...rest } = s.carts;
              return { carts: rest };
            }
            return { carts: { ...s.carts, [companyId]: { ...cart, items } } };
          }
          return {
            carts: {
              ...s.carts,
              [companyId]: {
                ...cart,
                items: cart.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
              },
            },
          };
        });
      },

      clearCompanyCart: (companyId) => {
        set((s) => {
          const { [companyId]: _, ...rest } = s.carts;
          return { carts: rest };
        });
      },

      clearAllCarts: () => set({ carts: {} }),

      totalForCompany: (companyId) => {
        const cart = get().carts[companyId];
        if (!cart) return 0;
        return cart.items.reduce((sum, i) => {
          const price = i.product.promoPrice != null ? Number(i.product.promoPrice) : Number(i.product.price ?? 0);
          return sum + price * i.quantity;
        }, 0);
      },

      totalItemCount: () =>
        Object.values(get().carts).reduce((sum, cart) => sum + cart.items.reduce((s, i) => s + i.quantity, 0), 0),
    }),
    { name: 'palmital-company-cart-v2' },
  ),
);
