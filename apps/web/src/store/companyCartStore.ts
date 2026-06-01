import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreProduct } from '../services/companiesApi';

interface CartItem {
  product: StoreProduct;
  quantity: number;
  notes?: string;
}

interface CompanyCartState {
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  items: CartItem[];
  addItem: (
    companyId: string,
    companyName: string,
    companySlug: string,
    product: StoreProduct,
    quantity?: number,
    notes?: string,
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
      items: [],

      addItem: (companyId, companyName, companySlug, product, quantity = 1, notes) => {
        const { items, companyId: currentCompanyId } = get();
        // Switching stores resets the cart
        if (currentCompanyId && currentCompanyId !== companyId) {
          set({ companyId, companyName, companySlug, items: [{ product, quantity, notes }] });
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
          set({
            companyId,
            companyName,
            companySlug,
            items: [...items, { product, quantity, notes }],
          });
        }
      },

      removeItem: (productId) =>
        set((s) => {
          const remaining = s.items.filter((i) => i.product.id !== productId);
          return {
            items: remaining,
            ...(remaining.length === 0
              ? { companyId: null, companyName: null, companySlug: null }
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

      clearCart: () => set({ companyId: null, companyName: null, companySlug: null, items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + (i.product.price ?? 0) * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'palmital-company-cart' },
  ),
);
