import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../services/deliveryApi';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantSlug: string | null;
  items: CartItem[];
  addItem: (
    restaurantId: string,
    restaurantName: string,
    restaurantSlug: string,
    item: MenuItem,
    quantity?: number,
    notes?: string,
  ) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      restaurantSlug: null,
      items: [],

      addItem: (restaurantId, restaurantName, restaurantSlug, item, quantity = 1, notes) => {
        const { items, restaurantId: currentRestaurantId } = get();
        if (currentRestaurantId && currentRestaurantId !== restaurantId) {
          set({ restaurantId, restaurantName, restaurantSlug, items: [{ menuItem: item, quantity, notes }] });
          return;
        }
        const existing = items.find((i) => i.menuItem.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItem.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
            ),
          });
        } else {
          set({ restaurantId, restaurantName, restaurantSlug, items: [...items, { menuItem: item, quantity, notes }] });
        }
      },

      removeItem: (menuItemId) =>
        set((s) => {
          const remaining = s.items.filter((i) => i.menuItem.id !== menuItemId);
          return {
            items: remaining,
            ...(remaining.length === 0
              ? { restaurantId: null, restaurantName: null, restaurantSlug: null }
              : {}),
          };
        }),

      updateQuantity: (menuItemId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.menuItem.id !== menuItemId)
              : s.items.map((i) => (i.menuItem.id === menuItemId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ restaurantId: null, restaurantName: null, restaurantSlug: null, items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + Number(i.menuItem.price) * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'palmital-cart' },
  ),
);
