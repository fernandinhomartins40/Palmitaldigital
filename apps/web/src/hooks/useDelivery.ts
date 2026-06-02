import { useState, useEffect, useCallback } from 'react';
import { deliveryApi, type Restaurant, type Order } from '../services/deliveryApi';

export function useRestaurants(category?: string, q?: string) {
  const [all, setAll] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await deliveryApi.listRestaurants();
      setAll(r.data);
    } catch {
      setError('Erro ao carregar restaurantes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Backend lists all restaurants; category/search are filtered client-side.
  const term = (q ?? '').trim().toLowerCase();
  const restaurants = all.filter((r) => {
    const matchCat = !category || (r.cuisine ?? '').toLowerCase() === category.toLowerCase();
    const matchQ =
      !term ||
      r.name.toLowerCase().includes(term) ||
      (r.cuisine ?? '').toLowerCase().includes(term);
    return matchCat && matchQ;
  });

  return { restaurants, loading, error, reload: load };
}

export function useRestaurant(slug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    deliveryApi.getRestaurant(slug)
      .then((r) => setRestaurant(r.data))
      .catch(() => setError('Restaurante não encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  return { restaurant, loading, error };
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await deliveryApi.getOrder(id);
      setOrder(r.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  return { order, loading, reload: load };
}

export function useMyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryApi.listMyOrders()
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  return { orders, loading };
}
