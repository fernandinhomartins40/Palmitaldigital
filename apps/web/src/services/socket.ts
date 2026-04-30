import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Cannot connect socket without access token');
  }

  const wsBase = import.meta.env.VITE_WS_URL || '';

  socket = io(`${wsBase}/chat`, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
    autoConnect: false,
  });

  socket.connect();
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
