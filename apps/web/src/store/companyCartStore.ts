import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreProduct } from '../services/companiesApi';

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CompanyCartState {
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  companyPhone: string | null; // whatsapp or phone for checkout URL
  items: CartItem[];
  addItem: (
    companyId: string,
    companyName: string,
    companySlug: string,
    companyPhone: string | null,
    product: StoreProduct,
    quantity?: number,
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCompanyCartStore = create<CompanyCartState>()(
  persist(
    (set, get) => ({
      companyId: null,
      companyName: null,
      companySlug: null,
      companyPhone: null,
      items: [],

      addItem: (companyId, companyName, companySlug, companyPhone, product, quantity = 1) => {
        const { items, companyId: currentId } = get();
        // Switching stores clears the cart automatically
        if (currentId && currentId !== companyId) {
          set({ companyId, companyName, companySlug, companyPhone, items: [{ product, quantity }] });
          return;
        }
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
            ),
          });
        } else {
          set({ companyId, companyName, companySlug, companyPhone, items: [...items, { product, quantity }] });
        }
      },

      removeItem: (productId) =>
        set((s) => {
          const remaining = s.items.filter((i) => i.product.id !== productId);
          return {
            items: remaining,
            ...(remaining.length === 0
              ? { companyId: null, companyName: null, companySlug: null, companyPhone: null }
              : {}),
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.product.id !== productId)
              : s.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
        })),

      clearCart: () =>
        set({ companyId: null, companyName: null, companySlug: null, companyPhone: null, items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + Number(i.product.price ?? 0) * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'palmital-company-cart' },
  ),
);
