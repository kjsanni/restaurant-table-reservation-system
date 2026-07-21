import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:8000';

let socket: Socket | null = null;

export function connectSocket(token: string | null): Socket | null {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    auth: token ? { token } : undefined,
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect error:', err.message);
  });

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

export type TableStatusEvent = {
  tableId: number;
  status: string;
};

export type TableFreedEvent = {
  tableId: number;
  reservationId?: number;
};

export type WaitlistOfferEvent = {
  tableId?: number;
  reservationId?: number;
  message?: string;
};

export function onTableStatusChanged(cb: (data: TableStatusEvent) => void) {
  socket?.on('table-status-changed', cb);
}

export function onTableFreed(cb: (data: TableFreedEvent) => void) {
  socket?.on('table-freed', cb);
}

export function onWaitlistOffer(cb: (data: WaitlistOfferEvent) => void) {
  socket?.on('waitlist-offer', cb);
}

export function offAll(event: string) {
  socket?.off(event);
}
