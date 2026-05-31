import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ridesApi, type Ride, type Driver } from '../services/ridesApi';
import { useAuthStore } from '../store/authStore';

export function useMyRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ridesApi.listMyRides()
      .then((r) => setRides(r.data))
      .finally(() => setLoading(false));
  }, []);

  return { rides, loading };
}

export function useRide(id: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore.getState().accessToken;

  const load = useCallback(async () => {
    try {
      const r = await ridesApi.getRide(id);
      setRide(r.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();

    const socket = io(`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}/rides`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_ride', { rideId: id });

    socket.on('driver_location', (data: { lat: number; lng: number }) => {
      setDriverPos(data);
    });

    socket.on('ride_updated', (data: Ride) => {
      setRide(data);
    });

    return () => { socket.disconnect(); };
  }, [id, token, load]);

  return { ride, loading, driverPos, reload: load };
}

export function useDriverSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore.getState().accessToken;
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}/rides`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('new_ride_request', (ride: Ride) => {
      setPendingRides((prev) => [ride, ...prev]);
    });

    socket.on('ride_cancelled', (data: { rideId: string }) => {
      setPendingRides((prev) => prev.filter((r) => r.id !== data.rideId));
    });
  }, [token]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const emitLocation = useCallback((lat: number, lng: number) => {
    socketRef.current?.emit('driver_location', { lat, lng });
  }, []);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  return { connect, disconnect, emitLocation, pendingRides, setPendingRides };
}
