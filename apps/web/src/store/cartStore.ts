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
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: MenuItem, quantity?: number, notes?: string) => void;
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
      items: [],

      addItem: (restaurantId, restaurantName, item, quantity = 1, notes) => {
        const { items, restaurantId: currentRestaurantId } = get();
        if (currentRestaurantId && currentRestaurantId !== restaurantId) {
          set({ restaurantId, restaurantName, items: [{ menuItem: item, quantity, notes }] });
          return;
        }
        const existing = items.find((i) => i.menuItem.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.menuItem.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ restaurantId, restaurantName, items: [...items, { menuItem: item, quantity, notes }] });
        }
      },

      removeItem: (menuItemId) =>
        set((s) => ({
          items: s.items.filter((i) => i.menuItem.id !== menuItemId),
          ...(s.items.filter((i) => i.menuItem.id !== menuItemId).length === 0
            ? { restaurantId: null, restaurantName: null }
            : {}),
        })),

      updateQuantity: (menuItemId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.menuItem.id !== menuItemId)
              : s.items.map((i) => (i.menuItem.id === menuItemId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ restaurantId: null, restaurantName: null, items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'palmital-cart' }
  )
);
